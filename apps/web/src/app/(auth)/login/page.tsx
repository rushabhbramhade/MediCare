import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PhoneOtpForm } from "@/features/auth/components/phone-otp-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Use your mobile number. We will text you a one-time code.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <PhoneOtpForm mode="login" />
        <p className="text-sm text-muted-foreground">
          New to Medicare?{" "}
          <Link
            href="/register"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Create an account
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
