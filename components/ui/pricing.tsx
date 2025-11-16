import { Button } from "@/components/ui/button";
import { Check, BarChart3, Users, Sparkles } from "lucide-react";
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
        <div className="w-full max-w-6xl mx-auto px-4 py-12 md:py-16">
            <div className="text-center space-y-4 mb-12">
                <p className="text-sm uppercase tracking-[0.3em] text-zinc-600">
                    {tag}
                </p>
                <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900">
                    {title}
                </h2>
                <p className="text-base sm:text-lg text-zinc-600 max-w-2xl mx-auto">
                    {description}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {tiers.map((tier) => (
                    <div
                        key={tier.name}
                        className={cn(
                            "relative group",
                            "transition-all duration-300"
                        )}
                    >
                        <div
                            className={cn(
                                "h-full bg-white border rounded-xl p-6",
                                "transition-all duration-300",
                                tier.popular
                                    ? "border-zinc-900 shadow-lg"
                                    : "border-zinc-200 hover:border-zinc-300 hover:shadow-md"
                            )}
                        >
                            {tier.popular && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-zinc-900 text-white px-4 py-1 rounded-full text-sm font-medium">
                                    Most Popular
                                </div>
                            )}

                            <div className="mb-6">
                                <div
                                    className={cn(
                                        "w-12 h-12 rounded-lg mb-4 flex items-center justify-center",
                                        tier.popular
                                            ? "bg-zinc-900 text-white"
                                            : "bg-zinc-100 text-zinc-900"
                                    )}
                                >
                                    {tier.icon}
                                </div>
                                <h3 className="text-xl font-semibold text-zinc-900 mb-2">
                                    {tier.name}
                                </h3>
                                <p className="text-sm text-zinc-600">
                                    {tier.description}
                                </p>
                            </div>

                            <div className="mb-6">
                                <div className="flex items-baseline gap-1">
                                    {tier.price === 0 ? (
                                        <span className="text-4xl font-bold text-zinc-900">
                                            Let's talk
                                        </span>
                                    ) : (
                                        <>
                                            <span className="text-4xl font-bold text-zinc-900">
                                                ${tier.price}
                                            </span>
                                            <span className="text-zinc-600">
                                                /month
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-3 mb-6">
                                {tier.features.map((feature) => (
                                    <div
                                        key={feature}
                                        className="flex items-start gap-3"
                                    >
                                        <div className="mt-0.5 w-5 h-5 rounded-full bg-zinc-100 flex items-center justify-center flex-shrink-0">
                                            <Check className="w-3 h-3 text-zinc-900" />
                                        </div>
                                        <span className="text-sm text-zinc-700">
                                            {feature}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <Button
                                className={cn(
                                    "w-full transition-all duration-300",
                                    tier.popular
                                        ? "bg-zinc-900 text-white hover:bg-zinc-800"
                                        : "bg-white text-zinc-900 border border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300"
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
