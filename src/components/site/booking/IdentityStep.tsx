"use client";

import { Dispatch, SetStateAction } from "react";
import { CheckCircle2, ScanFace, Video } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import SmartDocumentInput from "./SmartDocumentInput";
import VideoLivenessRecorder from "./VideoLivenessRecorder";
import { KycData } from "@/types/booking.types";

interface IdentityStepProps {
    kyc: KycData;
    setKyc: Dispatch<SetStateAction<KycData>>;
    isUserVerified: boolean;
    checkVerificationStatus: () => void;
}

export function IdentityStep({ kyc, setKyc, isUserVerified, checkVerificationStatus }: IdentityStepProps) {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            {isUserVerified && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6 flex flex-col items-center text-center">
                    <CheckCircle2 className="text-green-500 mb-2" size={32} />
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white">You are Verified!</h3>
                    <p className="text-zinc-500 text-sm mb-4">You have already completed the security check. You can proceed.</p>
                </div>
            )}

            {!isUserVerified && (
                <>
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm">
                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2"><ScanFace className="text-yellow-500" /> Driver Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div className="space-y-2"><Label>Full Name</Label><Input placeholder="John Doe" value={kyc.fullName} onChange={e => setKyc({ ...kyc, fullName: e.target.value })} className="h-11" /></div>
                            <div className="space-y-2"><Label>Phone Number</Label><Input placeholder="+254..." value={kyc.phone} onChange={e => setKyc({ ...kyc, phone: e.target.value })} className="h-11" /></div>
                            <div className="space-y-2"><Label>Email Address</Label><Input placeholder="john@example.com" value={kyc.email} onChange={e => setKyc({ ...kyc, email: e.target.value })} className="h-11" /></div>
                            <div className="space-y-2">
                                <Label>ID / Passport No</Label>
                                <Input
                                    placeholder="12345678"
                                    value={kyc.idNumber}
                                    onChange={e => setKyc({ ...kyc, idNumber: e.target.value.toUpperCase() })}
                                    onBlur={checkVerificationStatus}
                                    className="h-11 uppercase"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <SmartDocumentInput label="ID Front" value={kyc.idFront} onCapture={(f) => setKyc({ ...kyc, idFront: f })} />
                            <SmartDocumentInput label="ID Back" value={kyc.idBack} onCapture={(f) => setKyc({ ...kyc, idBack: f })} />
                            <SmartDocumentInput label="License" value={kyc.dlFront} onCapture={(f) => setKyc({ ...kyc, dlFront: f })} />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm">
                        <h3 className="text-lg font-bold mb-2 flex items-center gap-2"><Video className="text-yellow-500" /> Security Video Check</h3>
                        <p className="text-sm text-zinc-500 mb-4">Record a 5-second video of yourself saying your name. This protects you from identity theft.</p>
                        <VideoLivenessRecorder onRecordingComplete={(blob) => setKyc(prev => ({ ...prev, livenessVideo: blob }))} />
                    </div>
                </>
            )}
        </div>
    );
}
