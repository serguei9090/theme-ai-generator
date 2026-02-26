import { Badge } from "../atoms/badge";
import { Button } from "../atoms/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../atoms/card";
import { Separator } from "../atoms/separator";
import {
  ActionRow,
  ColorPill,
  MetricGrid,
  type MetricItem,
  MockSectionTitle,
} from "./_shared";

const NAV_ITEMS = ["Product", "Solutions", "Resources", "Enterprise"];
const TRUSTED = ["Northwind", "Contoso", "Fabricam", "Globex", "Initech"];
const FEATURE_CARDS = [
  {
    title: "Design Tokens Sync",
    description:
      "Push palette updates to app shells and component libraries in one pass.",
  },
  {
    title: "Brand Safe Variants",
    description:
      "Generate on-brand color permutations while preserving contrast thresholds.",
  },
  {
    title: "Review Workflows",
    description:
      "Collect stakeholder approvals with versioned palette proposals.",
  },
  {
    title: "Audit Ready Reports",
    description:
      "Export accessibility and visual consistency snapshots for compliance.",
  },
];
const WEBSITE_METRICS: MetricItem[] = [
  { label: "Demo-to-trial", value: "42%", trend: "+5.2% MoM", tone: "success" },
  {
    label: "Avg deploy time",
    value: "13m",
    trend: "-21% faster",
    tone: "secondary",
  },
  {
    label: "Brand consistency",
    value: "98/100",
    trend: "Across 6 products",
    tone: "accent",
  },
  {
    label: "Teams onboarded",
    value: "124",
    trend: "This quarter",
    tone: "default",
  },
];
const PLANS = [
  {
    name: "Growth",
    price: "$79",
    detail: "Best for scaling product teams",
    points: [
      "Unlimited palettes",
      "Design handoff export",
      "Role-based reviews",
    ],
    featured: false,
  },
  {
    name: "Enterprise",
    price: "$299",
    detail: "For multi-product organizations",
    points: ["Governance controls", "SAML + SCIM", "Dedicated success manager"],
    featured: true,
  },
  {
    name: "Agency",
    price: "$159",
    detail: "For client-delivery teams",
    points: [
      "Workspace templates",
      "White-label exports",
      "Client review portals",
    ],
    featured: false,
  },
];
const TESTIMONIALS = [
  {
    quote:
      "We replaced manual handoffs with a repeatable palette pipeline in one sprint.",
    author: "Mia Hart, VP Product Design",
  },
  {
    quote:
      "The previews let stakeholders sign off faster because they see real product contexts.",
    author: "Luca Mendez, Head of Experience",
  },
];

export default function WebsiteMockup() {
  return (
    <div className="w-full rounded-xl border border-[var(--sys-border)] bg-[var(--sys-elevation-bg)] p-4 text-[var(--sys-text)]">
      <Card className="mb-4">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-3 border-b border-[var(--sys-border)] bg-[var(--sys-elevation-card)]">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--sys-primary)] text-xs font-black text-[var(--sys-on-primary)] shadow-[0_0_10px_var(--sys-primary)]/20 transition-transform hover:rotate-12">
              AC
            </span>
            <p className="text-sm font-bold tracking-tight">Acme Platform</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="hidden lg:flex items-center gap-4 mr-2">
              {NAV_ITEMS.map((item) => (
                <span
                  key={item}
                  className="text-[10px] font-medium text-[var(--sys-text-medium)] hover:text-[var(--sys-primary)] cursor-pointer transition-all active:scale-90"
                >
                  {item}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2 border-l border-[var(--sys-border)] pl-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-3 text-[10px] transition-all active:scale-95"
              >
                Sign in
              </Button>
              <Button
                size="sm"
                className="h-7 px-3 text-[10px] shadow-sm transition-all shadow-[var(--sys-primary)]/10 active:scale-95"
              >
                Request Demo
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-4 p-4 lg:grid-cols-[1.5fr_1fr]">
          <div>
            <Badge variant="primary" className="mb-2">
              Enterprise Theme Operations
            </Badge>
            <h2 className="mt-2 text-3xl font-bold leading-tight tracking-tight">
              <span className="bg-gradient-to-r from-[var(--sys-primary)] to-[var(--sys-accent)] bg-clip-text text-transparent">
                Ship consistent color systems
              </span>
              <br />
              <span className="text-[var(--sys-text)]">
                across every product surface.
              </span>
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--sys-text-medium)] max-w-md">
              Centralize palette generation, stakeholder review, and rollout to
              web, desktop, and mobile experiences without visual drift.
            </p>
            <ActionRow
              className="mt-4"
              actions={[
                { label: "Start Free Trial" },
                { label: "View Platform Tour", variant: "outline" },
              ]}
            />
          </div>

          <Card className="bg-[var(--sys-elevation-card)]">
            <CardHeader>
              <CardTitle className="text-[var(--sys-text)]">
                Launch Readiness
              </CardTitle>
              <CardDescription className="text-[var(--sys-text-medium)]">
                Current release cycle at a glance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between gap-2 rounded-lg border border-[var(--sys-border)] bg-[var(--sys-surface)] p-2 transition-all hover:border-[var(--sys-primary)]/50">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-[var(--sys-success)] shadow-[0_0_8px_var(--sys-success)]" />
                  <span className="text-xs font-medium">
                    Component Coverage
                  </span>
                </div>
                <span className="text-xs font-bold text-[var(--sys-success)]">
                  94%
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 rounded-lg border border-[var(--sys-border)] bg-[var(--sys-surface)] p-2">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-[var(--sys-warning)]" />
                  <span className="text-xs font-medium">Contrast Checks</span>
                </div>
                <span className="text-xs font-bold text-[var(--sys-warning)]">
                  18/20
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 rounded-lg border border-[var(--sys-elevation-bg)] bg-[var(--sys-error)]/10 p-2 border-[var(--sys-error)]/20">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-[var(--sys-error)] animate-pulse" />
                  <span className="text-xs font-medium">
                    Visual Regressions
                  </span>
                </div>
                <span className="text-xs font-bold text-[var(--sys-error)]">
                  2 Issues
                </span>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardContent className="p-4">
          <MockSectionTitle
            eyebrow="Trusted By"
            title="Teams operating design systems at enterprise scale"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {TRUSTED.map((item) => (
              <Badge key={item} variant="outline" className="px-3 py-1 text-xs">
                {item}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardContent className="p-4">
          <MockSectionTitle
            eyebrow="Capabilities"
            title="Everything needed for production-ready palette workflows"
          />
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {FEATURE_CARDS.map((feature) => (
              <Card
                key={feature.title}
                className="bg-[var(--sys-elevation-bg)]"
              >
                <CardHeader>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription className="text-[var(--sys-text-medium)]">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardContent className="p-4">
          <MockSectionTitle
            eyebrow="Outcomes"
            title="Measured impact from color-system standardization"
          />
          <MetricGrid className="mt-3" metrics={WEBSITE_METRICS} />
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardContent className="p-4">
          <MockSectionTitle
            eyebrow="Pricing"
            title="Choose the right model for your organization"
          />
          <div className="mt-3 grid gap-3 lg:grid-cols-3">
            {PLANS.map((plan) => (
              <Card
                key={plan.name}
                className={plan.featured ? "border-primary shadow-sm" : ""}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{plan.name}</CardTitle>
                    {plan.featured && <Badge>Popular</Badge>}
                  </div>
                  <CardDescription>{plan.detail}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-xl font-semibold text-[var(--sys-text)]">
                    {plan.price}
                    <span className="text-sm font-normal text-[var(--sys-text-medium)]">
                      {" "}
                      /month
                    </span>
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      {
                        title: "Core Framework",
                        desc: "Foundation for consistency",
                        icon: "⚡",
                      },
                      {
                        title: "Scale Support",
                        desc: "Multi-platform variables",
                      },
                    ].map((feature) => (
                      <div
                        key={feature.title}
                        className="group rounded-xl border border-[var(--sys-border)] bg-[var(--sys-elevation-card)] p-4 transition-all hover:-translate-y-1 hover:border-[var(--sys-primary)]/50 hover:shadow-lg active:scale-95"
                      >
                        <div>
                          <h4 className="text-xs font-bold">{feature.title}</h4>
                          <p className="mt-0.5 text-[10px] leading-relaxed text-[var(--sys-text-medium)]">
                            {feature.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Card className="mt-4 border-[var(--sys-border)] bg-[var(--sys-elevation-card)] overflow-hidden">
                    <CardHeader className="pb-3 border-b border-[var(--sys-border)]/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-sm">
                            Design Tokens
                          </CardTitle>
                          <CardDescription className="text-[10px]">
                            Generated architectural palette
                          </CardDescription>
                        </div>
                        <Badge variant="outline" className="text-[9px]">
                          v1.0.4
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 bg-[var(--sys-elevation-bg)]/30">
                      <div className="flex flex-wrap gap-2">
                        <ColorPill
                          label="Primary"
                          colorVar="--sys-primary"
                          onColorVar="--sys-on-primary"
                        />
                        <ColorPill
                          label="Accent"
                          colorVar="--sys-accent"
                          onColorVar="--sys-on-accent"
                        />
                        <ColorPill
                          label="Success"
                          colorVar="--sys-success"
                          onColorVar="--sys-on-success"
                        />
                        <ColorPill
                          label="Warning"
                          colorVar="--sys-warning"
                          onColorVar="--sys-text"
                        />
                        <ColorPill
                          label="Error"
                          colorVar="--sys-error"
                          onColorVar="--text-white"
                        />
                        <ColorPill
                          label="Surface"
                          colorVar="--sys-elevation-card"
                          onColorVar="--sys-text"
                        />
                      </div>
                    </CardContent>
                  </Card>
                  <ul className="mt-3 space-y-1 text-xs text-[var(--sys-text-medium)]">
                    {plan.points.map((point) => (
                      <li key={point}>- {point}</li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    size="sm"
                    variant={plan.featured ? "default" : "outline"}
                  >
                    Choose {plan.name}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardContent className="p-4">
          <MockSectionTitle
            eyebrow="Customer Stories"
            title="What teams are saying"
          />
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {TESTIMONIALS.map((item) => (
              <Card key={item.author}>
                <CardContent className="space-y-2 p-4">
                  <p className="text-sm text-[var(--sys-text)]">
                    "{item.quote}"
                  </p>
                  <p className="text-xs text-[var(--sys-text-medium)]">
                    {item.author}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4 border-[var(--sys-primary)] bg-[var(--sys-primary)] text-[var(--sys-on-primary)] shadow-lg">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">
                Ready to standardize your product color system?
              </p>
              <p className="text-xs opacity-80">
                Start with one team today, scale across all surfaces next week.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                className="border-white/40 bg-white/10 text-[var(--sys-on-primary)] hover:bg-white/20"
              >
                Talk to Sales
              </Button>
              <Button
                size="sm"
                className="bg-[var(--sys-on-primary)] text-[var(--sys-primary)] hover:bg-[var(--sys-on-primary)]/90 font-semibold"
              >
                Start Trial
              </Button>
            </div>
          </div>
          <Separator
            className="my-3 opacity-25"
            style={{ backgroundColor: "var(--sys-on-primary)" }}
          />
          <p className="text-[11px] opacity-70">
            SOC2-ready workflows | SSO support | Global enterprise rollout
            playbooks
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
