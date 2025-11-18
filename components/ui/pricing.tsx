import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface PricingTier {
    name: string;
    icon: React.ReactNode;
    price: number;
    description: string;
    features: string[];
    popular?: boolean;
    cta?: string;
}

function Pricing({
    tag = "Simple Pricing",
    title = "Choose your plan",
    description = "Start managing creator partnerships today",
    tiers,
}: {
    tag?: string;
    title?: string;
    description?: string;
    tiers: PricingTier[];
}) {
    return (
        <div className="w-full max-w-7xl mx-auto px-4 py-16 md:py-24 relative">
            {/* Decorative elements */}
            <div className="absolute -z-10 top-20 left-10 w-72 h-72 bg-zinc-900/5 rounded-full blur-3xl" />
            <div className="absolute -z-10 bottom-20 right-10 w-96 h-96 bg-zinc-900/5 rounded-full blur-3xl" />

            <div className="text-center space-y-6 mb-16">
                <p className="text-sm uppercase tracking-[0.3em] text-zinc-600 font-medium">
                    {tag}
                </p>
                <div className="relative inline-block">
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif font-normal text-zinc-900 leading-tight">
                        {title}
                    </h2>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-32 h-3 bg-zinc-900/10 rounded-full blur-sm" />
                </div>
                <p className="text-lg md:text-xl text-zinc-600 max-w-2xl mx-auto leading-relaxed">
                    {description}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
                {tiers.map((tier, index) => (
                    <div
                        key={tier.name}
                        className={cn(
                            "relative group",
                            "transition-all duration-500 ease-out",
                            tier.popular && "md:-translate-y-4"
                        )}
                        style={{
                            animationDelay: `${index * 100}ms`
                        }}
                    >
                        {/* Card shadow/border effect */}
                        <div
                            className={cn(
                                "absolute inset-0 rounded-2xl transition-all duration-300",
                                tier.popular
                                    ? "bg-zinc-900 shadow-2xl"
                                    : "bg-white shadow-xl",
                                "group-hover:shadow-2xl group-hover:scale-[1.02]"
                            )}
                        />
                        
                        <div
                            className={cn(
                                "relative h-full rounded-2xl p-8 lg:p-10",
                                tier.popular
                                    ? "bg-zinc-900 text-white"
                                    : "bg-white"
                            )}
                        >
                            {tier.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white text-zinc-900 px-6 py-2 rounded-full text-sm font-semibold shadow-lg border-2 border-zinc-900">
                                    Most Popular
                                </div>
                            )}

                            <div className="mb-8">
                                <div
                                    className={cn(
                                        "w-14 h-14 rounded-xl mb-6 flex items-center justify-center transition-transform duration-300 group-hover:scale-110",
                                        tier.popular
                                            ? "bg-white text-zinc-900"
                                            : "bg-zinc-900 text-white"
                                    )}
                                >
                                    {tier.icon}
                                </div>
                                <h3 className={cn(
                                    "text-2xl lg:text-3xl font-serif font-normal mb-3",
                                    tier.popular ? "text-white" : "text-zinc-900"
                                )}>
                                    {tier.name}
                                </h3>
                                <p className={cn(
                                    "text-base leading-relaxed",
                                    tier.popular ? "text-zinc-300" : "text-zinc-600"
                                )}>
                                    {tier.description}
                                </p>
                            </div>

                            <div className="mb-8">
                                <div className="flex items-baseline gap-2">
                                    {tier.price === 0 ? (
                                        <span className={cn(
                                            "text-3xl lg:text-4xl font-serif font-normal",
                                            tier.popular ? "text-white" : "text-zinc-900"
                                        )}>
                                            Let's talk
                                        </span>
                                    ) : (
                                        <>
                                            <span className={cn(
                                                "text-5xl lg:text-6xl font-serif font-normal",
                                                tier.popular ? "text-white" : "text-zinc-900"
                                            )}>
                                                ${tier.price}
                                            </span>
                                            <span className={cn(
                                                "text-lg",
                                                tier.popular ? "text-zinc-400" : "text-zinc-500"
                                            )}>
                                                /month
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4 mb-8">
                                {tier.features.map((feature) => (
                                    <div
                                        key={feature}
                                        className="flex items-start gap-3"
                                    >
                                        <div className={cn(
                                            "mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110",
                                            tier.popular
                                                ? "bg-white/20"
                                                : "bg-zinc-100"
                                        )}>
                                            <Check className={cn(
                                                "w-4 h-4",
                                                tier.popular ? "text-white" : "text-zinc-900"
                                            )} />
                                        </div>
                                        <span className={cn(
                                            "text-base leading-relaxed",
                                            tier.popular ? "text-zinc-200" : "text-zinc-700"
                                        )}>
                                            {feature}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <Button
                                className={cn(
                                    "w-full h-12 text-base font-medium rounded-xl transition-all duration-300",
                                    "shadow-lg hover:shadow-xl",
                                    tier.popular
                                        ? "bg-white text-zinc-900 hover:bg-zinc-100"
                                        : "bg-zinc-900 text-white hover:bg-zinc-800"
                                )}
                            >
                                {tier.cta || "Get Started"}
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export { Pricing };
export type { PricingTier };
