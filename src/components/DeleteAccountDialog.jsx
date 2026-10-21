import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Trash2, CheckCircle2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export default function DeleteAccountDialog() {
  const [step, setStep] = useState("idle"); // idle | confirm | requested

  const handleRequestDeletion = () => {
    setStep("requested");
    // Log out after a short delay so the user sees the confirmation
    setTimeout(() => {
      base44.auth.logout("/");
    }, 3000);
  };

  return (
    <AlertDialog open={step !== "idle"} onOpenChange={(open) => { if (!open) setStep("idle"); }}>
      <AlertDialogTrigger asChild>
        <button
          onClick={() => setStep("confirm")}
          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Delete Account
        </button>
      </AlertDialogTrigger>

      <AlertDialogContent style={{ background: "var(--glass)", borderColor: "#C9A84C22" }}>
        {step === "confirm" && (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-gray-900">Delete Account</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-600">
                Are you sure you want to delete your account? Your deletion request will be sent to the administrator for processing. You will be signed out immediately.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-amber-200/60 text-white hover:bg-amber-50" onClick={() => setStep("idle")}>
                Cancel
              </AlertDialogCancel>
              <Button onClick={handleRequestDeletion} className="bg-red-600 hover:bg-red-700 text-white">
                Yes, Request Deletion
              </Button>
            </AlertDialogFooter>
          </>
        )}

        {step === "requested" && (
          <AlertDialogHeader className="items-center text-center pb-4">
            <CheckCircle2 className="w-12 h-12 text-green-400 mb-2" />
            <AlertDialogTitle className="text-gray-900">Request Submitted</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Your account deletion request has been submitted. You will be signed out shortly.
            </AlertDialogDescription>
          </AlertDialogHeader>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}