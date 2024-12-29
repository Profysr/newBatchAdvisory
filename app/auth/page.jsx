"use client";

import MagicButton from "@/components/Gen/Button";
import { InputField } from "@/components/Gen/InputField";
import { loginFn } from "@/functions/LoginAction";
import { useActionState } from "react";

const LoginForm = () => {
  const [state, loginAction] = useActionState(loginFn, undefined);
  return (
    <div
      className="w-full h-[100vh] flex justify-center items-center relative overflow-hidden"
      aria-label="Login Form Component"
    >
      <div className="w-full max-w-96 p-8 md:py-12 text-sm flex flex-col gap-6 rounded-lg">
        <div className="text-left font-semibold text-3xl">Login</div>
        <form className="flex flex-col gap-5" action={loginAction}>
          <div className="relative">
            <InputField
              id="email"
              name="email"
              title="Email"
              type="email"
              placeholder="Enter Your Email"
            />
            {state?.errors?.email && (
              <p className="text-red-500">{state.errors.email}</p>
            )}
          </div>
          <div className="relative">
            <InputField
              id="password"
              name="password"
              title={"Password"}
              type={"password"}
              placeholder={"Enter Your Password"}
            />
          </div>
          <MagicButton title="Sign In" type="submit" classname="!w-full" />
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
