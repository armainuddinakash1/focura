"use client";
import React, { useState } from "react";
import { useSignIn } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader } from "lucide-react";
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

function maskEmail(email: string): string {
    const [username, domain] = email.split("@");
    if (!username || !domain) {
        return "Invalid email";
    }
    const visibleChars = username.slice(0, 3);
    const maskedChars = "•".repeat(Math.max(username.length - 3, 0));
    return `${visibleChars}${maskedChars}@${domain}`;
}

export default function ForgotPassword() {
    const { signIn, errors, fetchStatus } = useSignIn();
    const router = useRouter();

    const [email, setEmail] = React.useState("");
    const [newPassword, setNewPassword] = React.useState("");
    const [confirmPassword, setConfirmPassword] = React.useState("");
    const [code, setCode] = React.useState("");
    const [errorMessage, setErrorMessage] = React.useState("");
    const [pendingVerification, setPendingVerification] = useState(false);
    const [emailVerified, setEmailVerified] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const isLoading = fetchStatus === "fetching";

    const ClerkErrorsMessage =
        errors?.global?.[0]?.message ??
        errors?.fields?.identifier?.message ??
        errors?.fields?.password?.message;

    // when user clicks send verification code
    // Step 1: Send the password reset code to the user's email
    async function handleSendVerificationCode(e: React.FormEvent) {
        e.preventDefault();
        setErrorMessage("");

        if (isLoading) return;

        const { error: createError } = await signIn.create({
            identifier: email,
        });
        if (createError) {
            console.error(JSON.stringify(createError, null, 2));
            setErrorMessage(createError.message);
            return;
        }

        const { error: sendCodeError } =
            await signIn.resetPasswordEmailCode.sendCode();
        if (sendCodeError) {
            console.error(JSON.stringify(sendCodeError, null, 2));
            setErrorMessage(sendCodeError.message);
            return;
        }
        setPendingVerification(true);
    }

    // Step 2: Verify the code provided by the user
    async function verifyCode(e: React.FormEvent) {
        e.preventDefault();
        setErrorMessage("");

        if (isLoading) return;

        const { error } = await signIn.resetPasswordEmailCode.verifyCode({
            code,
        });
        if (error) {
            console.error(JSON.stringify(error, null, 2));
            setErrorMessage(error.message);
            return;
        }
        setEmailVerified(true);
        setPendingVerification(false);
    }

    // Step 3: Submit the new password
    async function submitNewPassword(e: React.FormEvent) {
        e.preventDefault();
        setErrorMessage("");

        if (isLoading) return;

        if (newPassword !== confirmPassword) {
            setErrorMessage("Confirm password did not match");
            return;
        }

        const { error } = await signIn.resetPasswordEmailCode.submitPassword({
            password: newPassword,
            // Optional: sign the user out of all other authenticated sessions
            signOutOfOtherSessions: true,
        });
        if (error) {
            console.error(JSON.stringify(error, null, 2));
            setErrorMessage(error.message);
            return;
        }

        if (signIn.status === "complete") {
            const { error } = await signIn.finalize({
                navigate: async ({ session }) => {
                    // Handle session tasks
                    // See https://clerk.com/docs/guides/development/custom-flows/authentication/session-tasks
                    if (session?.currentTask) {
                        console.log(session.currentTask);
                        setErrorMessage(
                            "Sign-in attempt not complete. Please check the console for details.",
                        );
                        return;
                    }

                    // If no session tasks, navigate the signed-in user to the dashboard page
                    router.push("/dashboard");
                },
            });

            if (error) {
                console.error(JSON.stringify(error, null, 2));
                setErrorMessage(error.message);
                return;
            }
        } else if (signIn.status === "needs_second_factor") {
            // See https://clerk.com/docs/guides/development/custom-flows/authentication/multi-factor-authentication
            setErrorMessage(
                "2FA is required, but this UI does not handle that.",
            );
        } else {
            // Check why the sign-in is not complete
            console.error("Sign-in attempt not complete:", signIn);
            setErrorMessage(
                "Sign-in attempt not complete. Please check the console for details.",
            );
        }
    }

    return (
        <>
            {!pendingVerification && !emailVerified && (
                <Card className="w-full max-w-sm">
                    <CardHeader>
                        <CardTitle className="text-center text-2xl font-bold">
                            Forgot Password
                        </CardTitle>
                        <CardDescription>
                            <p>
                                Enter your email address to receive verification
                                code
                            </p>
                        </CardDescription>
                        {isLoading && <Loader className="mx-auto mt-2" />}
                    </CardHeader>
                    <CardContent>
                        <form
                            className="space-y-4"
                            onSubmit={handleSendVerificationCode}
                        >
                            <div className="flex flex-col gap-6">
                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="m@example.com"
                                        value={email}
                                        onChange={(e) =>
                                            setEmail(e.target.value)
                                        }
                                        required
                                    />
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
                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isLoading}
                            >
                                {isLoading
                                    ? "Sending..."
                                    : "Send Verification Code"}
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="justify-center">
                        <p className="text-sm text-muted-foreground">
                            Don&apos;t have an account?{" "}
                            <Link
                                href="/sign-up"
                                className="font-medium text-primary hover:underline"
                            >
                                Sign up
                            </Link>
                        </p>
                    </CardFooter>
                </Card>
            )}
            {pendingVerification && !emailVerified && (
                <Card className="w-full max-w-sm">
                    <CardHeader>
                        <CardTitle className="text-center text-2xl font-bold">
                            Forgot Password
                        </CardTitle>
                        <CardDescription>
                            <p>
                                An email with a verification code was just sent
                                to
                            </p>
                            <p className="font-bold">{maskEmail(email)}</p>
                        </CardDescription>
                        {isLoading && <Loader className="mx-auto mt-2" />}
                    </CardHeader>
                    <CardContent>
                        <form className="space-y-4" onSubmit={verifyCode}>
                            <div className="flex flex-col gap-6">
                                <div className="grid gap-2">
                                    <Label htmlFor="code">
                                        Verification Code
                                    </Label>
                                    <Input
                                        id="code"
                                        type="text"
                                        placeholder="123456"
                                        value={code}
                                        onChange={(e) =>
                                            setCode(e.target.value)
                                        }
                                        required
                                    />
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
                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isLoading}
                            >
                                {isLoading ? "Verifying..." : "Verify Email"}
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="justify-center">
                        <p className="text-sm text-muted-foreground">
                            Don&apos;t have an account?{" "}
                            <Link
                                href="/sign-up"
                                className="font-medium text-primary hover:underline"
                            >
                                Sign up
                            </Link>
                        </p>
                    </CardFooter>
                </Card>
            )}
            {emailVerified && (
                <Card className="w-full max-w-sm">
                    <CardHeader>
                        <CardTitle className="text-center text-2xl font-bold">
                            Forgot Password
                        </CardTitle>
                        {isLoading && <Loader className="mx-auto mt-2" />}
                    </CardHeader>
                    <CardContent>
                        <form
                            onSubmit={submitNewPassword}
                            className="space-y-4"
                        >
                            <div className="grid gap-2">
                                <div className="flex items-center">
                                    <Label htmlFor="newPassword">
                                        Enter new password
                                    </Label>
                                </div>
                                <div className="relative">
                                    <Input
                                        type={
                                            showNewPassword
                                                ? "text"
                                                : "password"
                                        }
                                        id="newPassword"
                                        value={newPassword}
                                        onChange={(e) =>
                                            setNewPassword(e.target.value)
                                        }
                                        placeholder="Enter your password"
                                        required
                                        disabled={isLoading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowNewPassword(!showNewPassword)
                                        }
                                        className="absolute right-2 top-1/2 -translate-y-1/2"
                                        disabled={isLoading}
                                        aria-label={
                                            showNewPassword
                                                ? "Hide password"
                                                : "Show password"
                                        }
                                    >
                                        {showNewPassword ? (
                                            <EyeOff className="h-4 w-4 text-gray-500" />
                                        ) : (
                                            <Eye className="h-4 w-4 text-gray-500" />
                                        )}
                                    </button>
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <div className="flex items-center">
                                    <Label htmlFor="newPassword">
                                        Confirm new password
                                    </Label>
                                </div>
                                <div className="relative">
                                    <Input
                                        type={
                                            showConfirmPassword
                                                ? "text"
                                                : "password"
                                        }
                                        id="confirmPassword"
                                        value={confirmPassword}
                                        onChange={(e) =>
                                            setConfirmPassword(e.target.value)
                                        }
                                        placeholder="Enter your password"
                                        required
                                        disabled={isLoading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowConfirmPassword(
                                                !showConfirmPassword,
                                            )
                                        }
                                        className="absolute right-2 top-1/2 -translate-y-1/2"
                                        disabled={isLoading}
                                        aria-label={
                                            showConfirmPassword
                                                ? "Hide password"
                                                : "Show password"
                                        }
                                    >
                                        {showConfirmPassword ? (
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
                            {/* Verify */}
                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isLoading}
                            >
                                {isLoading ? "Updating..." : "Update Password"}
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="justify-center">
                        <p className="text-sm text-muted-foreground">
                            Don&apos;t have an account?{" "}
                            <Link
                                href="/sign-up"
                                className="font-medium text-primary hover:underline"
                            >
                                Sign up
                            </Link>
                        </p>
                    </CardFooter>
                </Card>
            )}
        </>
    );
}
