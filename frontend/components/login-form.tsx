"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SubmitHandler, useForm } from "react-hook-form"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { BACKEND_URL, SESSION_EXPIRE, SESSION_SECRET } from "@/lib/contants"
import { login, manualStoreToken, storeSession } from "@/lib/api"
import { useAuthStore } from "@/store/useAuthStore";

type Inputs = {
  email: string
  password: string
}

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const setUser = useAuthStore((state) => state.setUser);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<Inputs>()

  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    const res = await login(data)

    await manualStoreToken(res.response.access_token)

    // await storeSession(res.response.user)
    
    // (await cookies()).set('token', res.response.access_token, {
    //   httpOnly: true,
    //   secure: false, // true -> só envia via HTTPS
    //   sameSite: "strict",
    //   // maxAge: 10, // 2h
    //   maxAge: 60 * 60 * 12, // 12h
    // })

    if (res.ok) {
      const user = res.response.payload;
      setUser({
        id: user.sub,
        email: user.username,
        role: user.role,
        token: res.response.access_token,
      });
        
      toast.success("Sucesso", {
        description: "Login efetuado com sucesso!",
      })

      setTimeout(() => {
        router.push("/dashboard")
      }, 1000);
    } else {
      toast.error("Erro", {
        description: "Credenciais incorretas!",
      })
    }


    // toast.success("Sucesso", {
    //   description: "Login efetuado com sucesso",
    // })

  }

  
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Entre na sua conta</CardTitle>
          <CardDescription>
            Digite seu login abaixo para entrar na sua conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-3">
                <Label htmlFor="email">Login</Label>
                <Input 
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  {...register("email", {
                    required: "Campo Login não pode estar vazio",
                    maxLength: { value: 100, message: "Login não pode ter mais de 100 caracteres" }
                  })}
                />
                {errors.email && (
                  <p className="text-red-600 text-sm ml-1" role="alert"> { errors.email.message } </p>
                )}
              </div>
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password">Senha</Label>
                  
                  {/* <a
                    href="#"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </a> */}
                </div>
                <Input 
                  id="password"
                  type="password"
                  placeholder="Senha..."
                  {...register("password", {
                    required: "Campo Senha não pode estar vazio"
                  })}
                />
                {errors.password && (
                  <p className="text-red-600 text-sm ml-1" role="alert"> { errors.password.message } </p>
                )}
              </div>
              <div className="flex flex-col gap-3">
                <Button type="submit" className="w-full">
                  Login
                </Button>
                {/* <Button variant="outline" className="w-full">
                  Login with Google
                </Button> */}
              </div>
            </div>
            {/* <div className="mt-4 text-center text-sm">
              Don&apos;t have an account?{" "}
              <a href="#" className="underline underline-offset-4">
                Sign up
              </a>
            </div> */}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
