"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Loader2, ShieldAlert } from "lucide-react";
import { toast } from "sonner"; // Import Toast

interface Props {
  tripId: string;
  trigger?: React.ReactNode;
}

export default function ReportIssueWizard({ tripId, trigger }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [issueType, setIssueType] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = () => {
    if (!issueType || !description) return;
    
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setIsOpen(false);
      
      // Premium Success Alert
      toast.success("Report Submitted Successfully", {
        description: `Ticket #${Math.floor(Math.random() * 10000)} has been opened for trip ${tripId}. Support will contact you shortly.`,
        icon: <CheckCircleIcon className="text-green-500" />,
        duration: 5000,
      });
      
      // Reset form
      setIssueType("");
      setDescription("");
    }, 1500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger ? trigger : <Button variant="destructive">Report Issue</Button>}
      </DialogTrigger>
      
      <DialogContent className="glass-panel border-zinc-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-500">
            <ShieldAlert size={20} />
            <span>Report Incident</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-zinc-400">Issue Type</Label>
            <Select onValueChange={setIssueType}>
              <SelectTrigger className="bg-zinc-900 border-zinc-800"><SelectValue placeholder="Select incident type" /></SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                <SelectItem value="accident">Accident / Collision</SelectItem>
                <SelectItem value="breakdown">Mechanical Breakdown</SelectItem>
                <SelectItem value="tyre">Flat Tire</SelectItem>
                <SelectItem value="other">Other Issue</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label className="text-zinc-400">Description</Label>
            <Textarea 
              placeholder="Please describe what happened..." 
              className="bg-zinc-900 border-zinc-800 min-h-[100px] text-sm"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg flex gap-2 text-xs text-red-400">
            <AlertTriangle size={16} className="shrink-0" />
            <span>For emergencies or injuries, please call 911 immediately before reporting here.</span>
          </div>

          <Button 
            onClick={handleSubmit} 
            disabled={isLoading || !issueType || !description}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : "Submit Report"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { CheckCircle2 as CheckCircleIcon } from "lucide-react";