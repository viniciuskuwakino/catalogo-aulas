import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
// import "./globals.css";

import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Toaster } from "@/components/ui/sonner"


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      {children}
    </div>
    // <html lang="en">
    //   <body
    //     className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    //   >
    //     <SidebarProvider>
    //       <AppSidebar />
    //       <SidebarInset>
    //         <header className="flex h-16 shrink-0 items-center gap-2">
    //           <div className="flex items-center gap-2 px-4">
    //             <SidebarTrigger className="-ml-1" />
    //             {/* <Separator
    //               orientation="vertical"
    //               className="mr-2 data-[orientation=vertical]:h-4"
    //             /> */}
    //             {/* <Breadcrumb>
    //               <BreadcrumbList>
    //                 <BreadcrumbItem className="hidden md:block">
    //                   <BreadcrumbLink href="#">
    //                     Building Your Application
    //                   </BreadcrumbLink>
    //                 </BreadcrumbItem>
    //                 <BreadcrumbSeparator className="hidden md:block" />
    //                 <BreadcrumbItem>
    //                   <BreadcrumbPage>Data Fetching</BreadcrumbPage>
    //                 </BreadcrumbItem>
    //               </BreadcrumbList>
    //             </Breadcrumb> */}
    //           </div>
    //         </header>
    //         <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
    //           <div className="grid auto-rows-min gap-4 md:grid-cols-3">
    //             <div className="bg-muted/50 aspect-video rounded-xl" />
    //             <div className="bg-muted/50 aspect-video rounded-xl" />
    //             <div className="bg-muted/50 aspect-video rounded-xl" />
    //           </div>
    //           <div className="bg-muted/50 min-h-[100vh] flex-1 rounded-xl md:min-h-min">
    //             {children}
    //           </div>
    //         </div>
    //       </SidebarInset>
    //     </SidebarProvider>
    //     {/* {children} */}
    //     <Toaster theme="light" position="top-right" expand={true} richColors/>
    //   </body>
    // </html>
  );
}
