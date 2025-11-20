import Image from 'next/image'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { BarChart3, Users, FileCheck, TrendingUp, Shield, Zap } from 'lucide-react'

export function Features() {
    return (
        <section className="bg-white py-12 md:py-16 lg:py-20">
            <div className="mx-auto max-w-5xl px-6">
                <div className="text-center mb-12">
                    <h3 className="text-3xl sm:text-4xl md:text-5xl font-serif font-normal mb-4 text-zinc-900">Built for modern teams</h3>
                    <p className="text-zinc-600 max-w-2xl mx-auto text-base sm:text-lg md:text-xl leading-relaxed">
                        Everything you need to manage creator partnerships at scale
                    </p>
                </div>

                <div className="mx-auto grid gap-3 sm:grid-cols-5">
                    <Card className="group overflow-hidden border-zinc-200 bg-white sm:col-span-3 sm:rounded-none sm:rounded-tl-xl shadow-sm">
                        <CardHeader>
                            <div className="p-4 md:p-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="p-1.5 bg-zinc-100 rounded-md">
                                        <BarChart3 className="w-4 h-4 text-zinc-900" />
                                    </div>
                                    <p className="font-semibold text-zinc-900 text-base">Real-Time Analytics</p>
                                </div>
                                <p className="text-zinc-600 mt-2 max-w-sm text-sm leading-relaxed">Track engagement, reach, and ROI across all creators and campaigns. Get instant insights into what&apos;s working and what&apos;s not.</p>
                            </div>
                        </CardHeader>

                        <div className="relative h-fit pl-4 md:pl-8 pb-4 md:pb-8">
                            <div className="absolute -inset-6 [background:radial-gradient(75%_95%_at_50%_0%,transparent,#f3f1ea_100%)]"></div>

                            <div className="bg-[#f3f1ea] overflow-hidden rounded-tl-lg border-l border-zinc-200 border-t pl-2 pt-2">
                                <Image
                                    src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1400&h=900&fit=crop&q=80"
                                    className="rounded-tl-lg w-full"
                                    alt="Analytics dashboard showing metrics and charts"
                                    width={1400}
                                    height={900}
                                />
                            </div>
                        </div>
                    </Card>

                    <Card className="group overflow-hidden border-zinc-200 bg-white sm:col-span-2 sm:rounded-none sm:rounded-tr-xl shadow-sm">
                        <p className="mx-auto my-4 max-w-md text-balance px-4 text-center text-base font-semibold text-zinc-900 sm:text-lg md:p-6 md:my-6">Streamline collaboration and approvals</p>

                        <CardContent className="mt-auto h-fit p-0 pb-4 sm:pb-0">
                            <div className="relative mb-4 sm:mb-0">
                                <div className="absolute -inset-6 [background:radial-gradient(50%_75%_at_75%_50%,transparent,#ffffff_100%)]"></div>
                                <div className="aspect-4/3 overflow-hidden rounded-r-lg border border-zinc-200">
                                    <Image
                                        src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&h=900&fit=crop&q=80"
                                        className="w-full h-full object-cover"
                                        alt="Team collaboration and content review"
                                        width={1200}
                                        height={900}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="group p-4 border-zinc-200 bg-white sm:col-span-2 sm:rounded-none sm:rounded-bl-xl md:p-8 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="p-1.5 bg-zinc-100 rounded-md">
                                <Users className="w-4 h-4 text-zinc-900" />
                            </div>
                            <p className="font-semibold text-zinc-900 text-base">Collaboration Hub</p>
                        </div>
                        <p className="text-zinc-600 mb-6 text-sm leading-relaxed">Invite creators, assign projects, and manage deliverables without leaving the platform.</p>

                        <div className="flex justify-center gap-3 mt-auto">
                            <div className="bg-zinc-50 relative flex aspect-square size-14 items-center justify-center rounded-md border border-zinc-200 shadow-sm">
                                <FileCheck className="size-5 text-zinc-900" />
                            </div>
                            <div className="bg-zinc-50 flex aspect-square size-14 items-center justify-center rounded-md border border-zinc-200 shadow-sm">
                                <TrendingUp className="size-5 text-zinc-900" />
                            </div>
                        </div>
                    </Card>

                    <Card className="group relative border-zinc-200 bg-white sm:col-span-3 sm:rounded-none sm:rounded-br-xl shadow-sm">
                        <CardHeader className="p-4 md:p-8">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-1.5 bg-zinc-100 rounded-md">
                                    <Shield className="w-4 h-4 text-zinc-900" />
                                </div>
                                <p className="font-semibold text-zinc-900 text-base">Enterprise Ready</p>
                            </div>
                            <p className="text-zinc-600 mt-2 max-w-sm text-sm leading-relaxed">Multi-tenant architecture with role-based access control. Your data is secure and completely isolated.</p>
                        </CardHeader>
                        <CardContent className="relative h-fit px-4 pb-4 md:px-8 md:pb-8">
                            <div className="grid grid-cols-4 gap-2 md:grid-cols-6">
                                <div className="bg-zinc-50 rounded-md aspect-square border border-zinc-200 flex items-center justify-center">
                                    <Zap className="w-5 h-5 text-zinc-400" />
                                </div>
                                <div className="bg-zinc-50 rounded-md aspect-square border border-zinc-200 flex items-center justify-center">
                                    <Shield className="w-5 h-5 text-zinc-400" />
                                </div>
                                <div className="bg-zinc-50 rounded-md aspect-square border border-zinc-200 flex items-center justify-center">
                                    <Users className="w-5 h-5 text-zinc-400" />
                                </div>
                                <div className="bg-zinc-50 rounded-md aspect-square border border-zinc-200 flex items-center justify-center">
                                    <BarChart3 className="w-5 h-5 text-zinc-400" />
                                </div>
                                <div className="bg-zinc-50 rounded-md aspect-square border border-zinc-200 flex items-center justify-center">
                                    <FileCheck className="w-5 h-5 text-zinc-400" />
                                </div>
                                <div className="bg-zinc-50 rounded-md aspect-square border border-zinc-200 flex items-center justify-center">
                                    <TrendingUp className="w-5 h-5 text-zinc-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>
    )
}
