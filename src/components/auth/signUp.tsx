"use client";

import { useSignUp } from "@clerk/nextjs";
import { Eye, EyeOff, Loader } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

import { Alert, AlertDescription } from "@/components/ui/alert";

import { Button } from "@/components/ui/button";

function SignUpComponent() {
    const { signUp, errors, fetchStatus } = useSignUp();

    const router = useRouter();

    const [emailAddress, setEmailAddress] = useState("");
    const [password, setPassword] = useState("");
    const [code, setCode] = useState("");
    const [pendingVerification, setPendingVerification] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    /*
     * Clerk request state
     */
    const isLoading = fetchStatus === "fetching";

    /*
     * Clerk error
     */
    // errors from Clerk may have varying shapes; cast to any to safely access the first message
    const errorMessage =
        errors?.global?.[0]?.message ??
        errors?.fields?.emailAddress?.message ??
        errors?.fields?.password?.message;

    /*
     * Create the account and send
     * the email verification code.
     */
    async function submit(e: React.SyntheticEvent<HTMLFormElement>) {
        e.preventDefault();

        if (isLoading) return;

        try {
            const createResult = await signUp.password({
                emailAddress,
                password,
            });

            if (createResult.error) {
                return;
            }

            const sendCodeResult = await signUp.verifications.sendEmailCode();

            if (sendCodeResult.error) {
                return;
            }

            setPendingVerification(true);
        } catch (error) {
            console.error("Signup error:", error);
        }
    }

    /*
     * Verify the email address.
     */
    async function onPressVerify(e: React.SyntheticEvent<HTMLFormElement>) {
        e.preventDefault();

        if (isLoading) return;

        try {
            const verifyResult = await signUp.verifications.verifyEmailCode({
                code,
            });

            if (verifyResult.error) {
                return;
            }

            /*
             * Email verification succeeded.
             *
             * At this point Clerk should have a
             * completed signup.
             */
            if (signUp.status === "complete") {
                const finalizeResult = await signUp.finalize();

                if (finalizeResult.error) {
                    return;
                }

                router.push("/dashboard");
            }
        } catch (error) {
            console.error("Verification error:", error);
        }
    }

    return (
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle className="text-center text-2xl font-bold">
                    Sign Up for Todo Master
                </CardTitle>
                <Loader />
            </CardHeader>

            <CardContent>
                {!pendingVerification ? (
                    <form onSubmit={submit} className="space-y-4">
                        {/* Email */}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>

                            <Input
                                id="email"
                                type="email"
                                value={emailAddress}
                                onChange={(e) =>
                                    setEmailAddress(e.target.value)
                                }
                                required
                                disabled={isLoading}
                            />
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>

                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    required
                                    disabled={isLoading}
                                />

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }
                                    disabled={isLoading}
                                    className="absolute right-2 top-1/2 -translate-y-1/2"
                                    aria-label={
                                        showPassword
                                            ? "Hide password"
                                            : "Show password"
                                    }
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4 text-gray-500" />
                                    ) : (
                                        <Eye className="h-4 w-4 text-gray-500" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Error */}
                        {errorMessage && (
                            <Alert variant="destructive">
                                <AlertDescription>
                                    {errorMessage}
                                </AlertDescription>
                            </Alert>
                        )}

                        <div id="clerk-captcha" />

                        {/* Submit */}
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isLoading}
                        >
                            {isLoading ? "Creating account..." : "Sign Up"}
                        </Button>
                    </form>
                ) : (
                    <form onSubmit={onPressVerify} className="space-y-4">
                        {/* Verification code */}
                        <div className="space-y-2">
                            <Label htmlFor="code">Verification Code</Label>

                            <Input
                                id="code"
                                type="text"
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                placeholder="Enter verification code"
                                required
                                disabled={isLoading}
                            />
                        </div>

                        {/* Error */}
                        {errorMessage && (
                            <Alert variant="destructive">
                                <AlertDescription>
                                    {errorMessage}
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Verify */}
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isLoading}
                        >
                            {isLoading ? "Verifying..." : "Verify Email"}
                        </Button>
                    </form>
                )}
            </CardContent>

            <CardFooter className="justify-center">
                <p className="text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Link
                        href="/sign-in"
                        className="font-medium text-primary hover:underline"
                    >
                        Sign in
                    </Link>
                </p>
            </CardFooter>
        </Card>
    );
}

export default SignUpComponent;
