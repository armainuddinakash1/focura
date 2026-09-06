"use client";
import { useSignIn } from "@clerk/nextjs";
import { Eye, EyeOff, Loader } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
// import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
// import { isClerkAPIResponseError } from "@clerk/nextjs/errors";

function SignInComponent() {
    const { signIn, errors, fetchStatus } = useSignIn();

    const router = useRouter();

    const [emailAddress, setEmailAddress] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    // const [errorArr, setErrorArr] = useState<ErrorItem[]>([]);
    const isLoading = fetchStatus === "fetching";

    const errorMessage =
        errors?.global?.[0]?.message ??
        errors?.fields?.identifier?.message ??
        errors?.fields?.password?.message;

    async function submit(e: React.SyntheticEvent<HTMLFormElement>) {
        e.preventDefault();
        // setErrorArr([]);
        if (isLoading) return;

        // try {
        const { error } = await signIn.password({
            emailAddress,
            password,
        });

        if (error) {
            return;
        }

        /*
         * If MFA is enabled, Clerk will require
         * a second factor before finalization.
         */
        if (signIn.status === "needs_second_factor") {
            // Handle MFA here.
            return;
        }

        if (signIn.status === "complete") {
            await signIn.finalize();

            router.push("/dashboard");
        }
    }
    return (
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle className="text-2xl font-bold text-center">
                    Sign In
                </CardTitle>
                {isLoading && <Loader className="mx-auto mt-2" />}{" "}
            </CardHeader>
            <CardContent>
                <form onSubmit={submit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            type="email"
                            id="email"
                            value={emailAddress}
                            onChange={(e) => setEmailAddress(e.target.value)}
                            required
                            disabled={isLoading}
                        />
                    </div>
                    <div className="grid gap-2">
                        <div className="flex items-center">
                            <Label htmlFor="password">Password</Label>
                            <a
                                href="/forgot-password"
                                className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                            >
                                Forgot your password?
                            </a>
                        </div>
                        <div className="relative">
                            <Input
                                type={showPassword ? "text" : "password"}
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-2 top-1/2 -translate-y-1/2"
                                disabled={isLoading}
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
                    {/* {errorArr.length > 0 && (
                            <Alert variant="destructive">
                                <AlertDescription className="space-y-2">
                                    {errorArr.map((error, index) => (
                                        <div key={index}>
                                            <strong>{error.code}</strong>:{" "}
                                            {error.message}
                                        </div>
                                    ))}
                                </AlertDescription>
                            </Alert>
                        )} */}
                    {errorMessage && (
                        <p className="text-sm text-red-600">{errorMessage}</p>
                        // got to gpts fix error types chat
                    )}
                    <div id="clerk-captcha" />
                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isLoading}
                    >
                        Sign In
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
    );
}

export default SignInComponent;
