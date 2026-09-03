"use client";
import React from "react";
import { useSignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Loader } from "lucide-react";

export default function ForgotPassword() {
    const { signIn, errors, fetchStatus } = useSignIn();
    const router = useRouter();

    const [emailAddress, setEmailAddress] = React.useState("");
    const [code, setCode] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [codeSent, setCodeSent] = React.useState(false);
    const [errorMessage, setErrorMessage] = React.useState("");

    const isLoading = fetchStatus === "fetching";

    const errorsMessage =
        errors?.global?.[0]?.message ??
        errors?.fields?.identifier?.message ??
        errors?.fields?.password?.message;
    
    setErrorMessage(errorsMessage || "");

    // Step 1: Send the password reset code to the user's email
    async function sendCode(e: React.FormEvent) {
        e.preventDefault();
        setErrorMessage("");

        if (isLoading) return;

        const { error: createError } = await signIn.create({
            identifier: emailAddress,
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

        setCodeSent(true);
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
    }

    // Step 3: Submit the new password
    async function submitNewPassword(e: React.FormEvent) {
        e.preventDefault();
        setErrorMessage("");

        if (isLoading) return;

        const { error } = await signIn.resetPasswordEmailCode.submitPassword({
            password,
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
                navigate: async ({ session, decorateUrl }) => {
                    // Handle session tasks
                    // See https://clerk.com/docs/guides/development/custom-flows/authentication/session-tasks
                    if (session?.currentTask) {
                        console.log(session.currentTask);
                        setErrorMessage("Sign-in attempt not complete. Please check the console for details.");
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
            setErrorMessage("2FA is required, but this UI does not handle that.");
        } else {
            // Check why the sign-in is not complete
            console.error("Sign-in attempt not complete:", signIn);
            setErrorMessage("Sign-in attempt not complete. Please check the console for details.");
        }
    }

    return (
        <div>
            <h1>Forgot Password?</h1>

            {isLoading && <Loader className="mx-auto mt-2" />}

            {/* Step 1 UI: Collect the user's email so you can send them a password reset code */}
            {!codeSent && (
                <form onSubmit={sendCode}>
                    <label htmlFor="emailAddress">
                        Provide your email address
                    </label>
                    <input
                        id="emailAddress"
                        type="email"
                        placeholder="e.g john@doe.com"
                        value={emailAddress}
                        onChange={(e) => setEmailAddress(e.target.value)}
                    />
                    {errorMessage && <p>{errorMessage}</p>}
                    <button type="submit" disabled={isLoading}>
                        Send password reset code
                    </button>
                </form>
            )}

            {/* Step 2 UI: Collect the code provided by the user */}
            {codeSent && signIn.status !== "needs_new_password" && (
                <form onSubmit={verifyCode}>
                    <label htmlFor="code">
                        Enter the password reset code that was sent to your
                        email
                    </label>
                    <input
                        id="code"
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                    />
                    {errorMessage && <p>{errorMessage}</p>}
                    <button type="submit" disabled={isLoading}>
                        Verify code
                    </button>
                </form>
            )}

            {/* Step 3 UI: Collect the new password from the user */}
            {signIn.status === "needs_new_password" && (
                <form onSubmit={submitNewPassword}>
                    <label htmlFor="password">Enter your new password</label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    {errorMessage && <p>{errorMessage}</p>}
                    <button type="submit" disabled={isLoading}>
                        Set new password
                    </button>
                </form>
            )}

            {/* Step 4 UI: Handle 2FA, or other authentication requirements
      depending on the settings you've enabled in the Clerk Dashboard.
      This may require combining this flow with other custom flows. */}
            {signIn.status === "needs_second_factor" && (
                <p>2FA is required, but this UI does not handle that.</p>
            )}

            {/* For your debugging purposes. You can just console.log errors,
      but we put them in the UI for convenience */}
        </div>
    );
}
