"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { StepIndicator } from "./StepIndicator";
import { LogisticsStep } from "./LogisticsStep";
import { IdentityStep } from "./IdentityStep";
import { ContractStep } from "./ContractStep";
import { PaymentStep } from "./PaymentStep";
import { SuccessStep } from "./SuccessStep";
import { OrderSummary } from "./OrderSummary";
import { FleetUnit, TripDetails, KycData, ContractData, PaymentDetails } from "@/types/booking.types";
import { STEPS } from "@/lib/constants";

interface BookingWizardProps {
  unitId: string;
  paramStart: string;
  paramEnd: string;
}

export function BookingWizard({ unitId, paramStart, paramEnd }: BookingWizardProps) {
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState<string>("logistics");
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [selectedUnit, setSelectedUnit] = useState<FleetUnit | null>(null);
  const [isUserVerified, setIsUserVerified] = useState(false);
  
  const [trip, setTrip] = useState<TripDetails>({
    startDate: paramStart,
    endDate: paramEnd,
    pickupType: 'hub',
    deliveryAddress: "",
    distanceKm: 0,
    location: "Westlands Hub"
  });

  const [kyc, setKyc] = useState<KycData>({
    fullName: "",
    phone: "",
    email: "",
    idNumber: "",
    idFront: null,
    idBack: null,
    dlFront: null,
    livenessVideo: null,
  });

  const [contract, setContract] = useState<ContractData>({
    signatureBlob: null,
  });

  const [payment, setPayment] = useState<PaymentDetails>({
    method: 'mpesa',
    mpesaCode: '',
    cardName: '',
    cardNumber: '',
    cardExpiry: '',
    cardCvc: '',
  });

  const [conflictError, setConflictError] = useState<string | null>(null);
  const sigPad = useRef<any>(null);

  useEffect(() => {
    async function fetchCarDetails() {
      if (!unitId) return;
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('fleet_units')
        .select(`
          id, public_id, status, images,
          model:fleet_models ( make, model, daily_rate, image_url )
        `)
        .eq('id', unitId)
        .single();

      if (error || !data) {
        toast.error("Vehicle not found or unavailable");
        router.push('/fleet');
        return;
      }

      const modelData = Array.isArray(data.model) ? data.model[0] : data.model;

      setSelectedUnit({
        id: data.id,
        public_id: data.public_id,
        price: modelData.daily_rate,
        modelName: `${modelData.make} ${modelData.model}`,
        image: data.images?.[0] || modelData.image_url,
        status: data.status
      });
      setIsLoading(false);
    }

    fetchCarDetails();
  }, [unitId, router]);

  const totalDays = useMemo(() => {
    if (!trip.startDate || !trip.endDate) return 1;
    const start = new Date(trip.startDate).getTime();
    const end = new Date(trip.endDate).getTime();
    const diffHours = Math.abs(end - start) / 36e5;
    return Math.ceil(diffHours / 24) || 1;
  }, [trip.startDate, trip.endDate]);

  const costs = useMemo(() => {
    const daily = selectedUnit?.price || 0;
    const subtotal = daily * totalDays;
    const deliveryFee = trip.pickupType === 'delivery' ? (trip.distanceKm * 100) : 0;
    const total = subtotal + deliveryFee; 
    return { subtotal, deliveryFee, total };
  }, [selectedUnit, totalDays, trip.pickupType, trip.distanceKm]);

  const uploadFile = async (file: File | Blob, bucket: string, path: string) => {
    const { data, error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    if (error) throw error;
    const { data: publicUrl } = supabase.storage.from(bucket).getPublicUrl(path);
    return publicUrl.publicUrl;
  };

  const handleFinalSubmission = async () => {
    if (!selectedUnit) return;
    setIsProcessing(true);

    try {
        let customerId: string;
        let isNewCustomer = false;

        const { data: existingCust } = await supabase
            .from('customers')
            .select('id, is_verified')
            .eq('id_number', kyc.idNumber)
            .single();

        if (existingCust) {
            customerId = existingCust.id;
        } else {
            isNewCustomer = true;
            const timestamp = Date.now();
            
            const idFrontUrl = kyc.idFront ? await uploadFile(kyc.idFront, 'customer-docs', `ids/${kyc.idNumber}_front_${timestamp}`) : null;
            const dlUrl = kyc.dlFront ? await uploadFile(kyc.dlFront, 'customer-docs', `licenses/${kyc.idNumber}_${timestamp}`) : null;
            const videoUrl = kyc.livenessVideo ? await uploadFile(kyc.livenessVideo, 'customer-docs', `liveness/${kyc.idNumber}_${timestamp}.webm`) : null;

            const { data: newCust, error: custError } = await supabase
                .from('customers')
                .insert({
                    full_name: kyc.fullName,
                    phone: kyc.phone,
                    email: kyc.email,
                    id_number: kyc.idNumber,
                    id_image_url: idFrontUrl,
                    dl_image_url: dlUrl,
                    liveness_video_url: videoUrl,
                    is_verified: false,
                    trust_score: "100", 
                    status: "active"
                })
                .select()
                .single();
            
            if (custError) throw custError;
            customerId = newCust.id;
        }

        let signatureUrl = null;
        if (contract.signatureBlob) {
             signatureUrl = await uploadFile(contract.signatureBlob, 'signatures', `contract_${customerId}_${Date.now()}.png`);
        }

        // Mock payment verification
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate network request

        const { data: bookingData, error: bookingError } = await supabase
            .from('bookings')
            .insert({
                customer_id: customerId,
                unit_id: selectedUnit.id,
                start_date: trip.startDate,
                end_date: trip.endDate,
                total_cost: costs.total,
                payment_method: payment.method,
                payment_status: 'completed', 
                mpesa_code: payment.mpesaCode,
                status: 'confirmed',
                signature_url: signatureUrl,
                pickup_type: trip.pickupType,
                delivery_address: trip.pickupType === 'delivery' ? trip.deliveryAddress : null,
                delivery_distance_km: trip.pickupType === 'delivery' ? trip.distanceKm : 0,
                delivery_fee: costs.deliveryFee
            })
            .select('id')
            .single();

        if (bookingError) throw bookingError;

        setCurrentStep("success");
        
        toast.success("Booking Confirmed!", {
            description: "Your payment has been verified and the vehicle is reserved.",
        });

        // Redirect after a delay
        setTimeout(() => {
            if (isNewCustomer || !isUserVerified) {
                router.push(`/status/${bookingData.id}`);
            } else {
                router.push('/dashboard');
            }
        }, 3000);

    } catch (error: any) {
        console.error("Booking Failed:", error);
        toast.error("Booking Failed", { description: error.message || "An unexpected error occurred. Please try again." });
    } finally {
        setIsProcessing(false);
    }
  };

  const checkVerificationStatus = async () => {
     if(kyc.idNumber.length < 6) return;
     
     const { data } = await supabase
        .from('customers')
        .select('id, is_verified, full_name, phone, email')
        .eq('id_number', kyc.idNumber)
        .single();

     if (data) {
         setKyc(prev => ({...prev, fullName: data.full_name, phone: data.phone, email: data.email || ""}));
         if (data.is_verified) {
             setIsUserVerified(true);
             toast.success(`Welcome back, ${data.full_name}!`, { description: "You are a verified client. We've pre-filled your details." });
         }
     }
  };

  const handleNextStep = () => {
    const currentIdx = STEPS.findIndex(s => s.id === currentStep);
    if (currentIdx < STEPS.length - 1) {
        // Validation logic
        if (currentStep === 'logistics') {
            const start = new Date(trip.startDate).getTime();
            const end = new Date(trip.endDate).getTime();
            if (start >= end) {
                setConflictError("Return date must be after pickup date.");
                return;
            }
            if (trip.pickupType === 'delivery' && (!trip.deliveryAddress || trip.distanceKm <= 0)) {
                toast.error("Delivery Details Missing", { description: "Please provide a valid delivery address and distance."});
                return;
            }
            setConflictError(null);
        }
        else if (currentStep === 'identity') {
            if (!isUserVerified) {
                if (!kyc.fullName || !kyc.phone || !kyc.idNumber || !kyc.idFront || !kyc.dlFront) {
                    toast.error("Incomplete Documents", { description: "Please upload your ID and Driver's License." });
                    return;
                }
                if (!kyc.livenessVideo) {
                    toast.error("Security Check Failed", { description: "Please complete the video selfie to proceed." });
                    return;
                }
            }
        }
        else if (currentStep === 'contract') {
            if (sigPad.current?.isEmpty()) {
                toast.error("Signature Required", { description: "Please sign the rental agreement to continue."});
                return;
            }
            sigPad.current.getTrimmedCanvas().toBlob((blob: Blob) => {
                setContract({ signatureBlob: blob });
            });
        }
        else if (currentStep === 'payment') {
            if (payment.method === 'mpesa' && payment.mpesaCode.length < 10) {
                toast.error("Invalid M-Pesa Code", { description: "Please enter a valid 10-character M-Pesa transaction code."});
                return;
            }
            if (payment.method === 'card') {
                if (!payment.cardName || !payment.cardNumber || !payment.cardExpiry || !payment.cardCvc) {
                    toast.error("Incomplete Card Details", { description: "Please fill in all credit card fields."});
                    return;
                }
                // Basic card validation
                if (payment.cardNumber.length < 15 || payment.cardCvc.length < 3) {
                     toast.error("Invalid Card Details", { description: "Please check your card number and CVC."});
                     return;
                }
            }
            handleFinalSubmission();
            return; // Don't proceed to next step automatically
        }
        
        setCurrentStep(STEPS[currentIdx + 1].id);
    }
  };

  const handlePrevStep = () => {
    const currentIdx = STEPS.findIndex(s => s.id === currentStep);
    if (currentIdx > 0) {
      setCurrentStep(STEPS[currentIdx - 1].id);
    }
  };

  if (isLoading || !selectedUnit) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center">
        <Loader2 className="animate-spin text-yellow-500" size={40} />
      </div>
    );
  }

  const renderStep = () => {
    switch (currentStep) {
      case 'logistics':
        return <LogisticsStep trip={trip} setTrip={setTrip} conflictError={conflictError} />;
      case 'identity':
        return <IdentityStep kyc={kyc} setKyc={setKyc} isUserVerified={isUserVerified} checkVerificationStatus={checkVerificationStatus} />;
      case 'contract':
        return <ContractStep kyc={kyc} selectedUnit={selectedUnit} trip={trip} costs={costs} sigPad={sigPad} />;
      case 'payment':
        return <PaymentStep payment={payment} setPayment={setPayment} costs={costs} selectedUnit={selectedUnit} />;
      case 'success':
        return <SuccessStep />;
      default:
        return null;
    }
  };

  return (
    <div className="pt-32 pb-20 container mx-auto px-6 max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8">
          <StepIndicator currentStep={currentStep} />
          <div className="mt-8">
            {renderStep()}
          </div>
          <div className="mt-8 flex justify-between items-center">
            <button
                onClick={handlePrevStep}
                disabled={currentStep === 'logistics' || isProcessing}
                className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Previous Step
            </button>
            {currentStep !== 'success' && (
              <button
                onClick={handleNextStep}
                disabled={isProcessing}
                className="bg-zinc-900 dark:bg-white text-white dark:text-black font-bold text-lg rounded-xl h-14 w-48 flex items-center justify-center disabled:opacity-50"
              >
                {isProcessing ? <Loader2 className="animate-spin" /> : currentStep === 'payment' ? 'Confirm Booking' : 'Continue'}
              </button>
            )}
          </div>
        </div>
        <div className="lg:col-span-4">
          <OrderSummary selectedUnit={selectedUnit} trip={trip} totalDays={totalDays} costs={costs} />
        </div>
      </div>
    </div>
  );
}
