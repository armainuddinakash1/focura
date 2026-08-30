"use client";

import { useSignIn } from "@clerk/nextjs";
import { Eye, EyeOff } from "lucide-react";
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
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";

type ErrorItem = {
    code: string;
    message: string;
};

function Signin() {
    const { signIn, fetchStatus } = useSignIn();

    const router = useRouter();

    const [emailAddress, setEmailAddress] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const [errorArr, setErrorArr] = useState<ErrorItem[]>([]);
    const isLoading = fetchStatus === "fetching";

    async function submit(e: React.SyntheticEvent<HTMLFormElement>) {
        e.preventDefault();
        setErrorArr([]);

        try {
            const result = await signIn.password({
                emailAddress,
                password,
            });
            if (signIn.status === "complete") {
                await signIn.finalize();

                router.push("/dashboard");
            } else {
                console.log(JSON.stringify(result, null, 2));
            }
        } catch (error) {
            if (isClerkAPIResponseError(error)) {
                const clerkErrors: ErrorItem[] = [];
                error.errors.map((err) => {
                    console.log(err.code);
                    console.log(err.message);
                    clerkErrors.push({ code: err.code, message: err.message });
                });
                setErrorArr(clerkErrors);
            } else {
                console.log(error);
            }
        }
    }
    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-center">
                        Sign In to Todo Master
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={submit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                type="email"
                                id="email"
                                value={emailAddress}
                                onChange={(e) =>
                                    setEmailAddress(e.target.value)
                                }
                                required
                                disabled={isLoading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <div className="relative">
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
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
                        {errorArr.length > 0 && (
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
        </div>
    );
}

export default Signin;
