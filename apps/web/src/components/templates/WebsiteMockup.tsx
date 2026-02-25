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
    <div className="w-full rounded-xl border border-border bg-background p-4 text-text">
      <Card className="mb-4">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
              AC
            </span>
            <p className="text-sm font-semibold">Acme Platform</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {NAV_ITEMS.map((item) => (
              <Button key={item} variant="ghost" size="sm">
                {item}
              </Button>
            ))}
            <Button variant="outline" size="sm">
              Sign in
            </Button>
            <Button size="sm">Request Demo</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-4 p-4 lg:grid-cols-[1.5fr_1fr]">
          <div>
            <Badge variant="secondary">Enterprise Theme Operations</Badge>
            <h2 className="mt-2 text-2xl font-semibold leading-tight">
              Ship consistent color systems across every product surface.
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
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

          <Card className="bg-surface">
            <CardHeader>
              <CardTitle>Launch Readiness</CardTitle>
              <CardDescription>
                Current release cycle at a glance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="rounded-md bg-primary/15 px-3 py-2 text-xs">
                Component coverage: 94%
              </div>
              <div className="rounded-md bg-secondary/20 px-3 py-2 text-xs">
                Contrast checks passed: 18/20
              </div>
              <div className="rounded-md bg-accent/20 px-3 py-2 text-xs">
                Product surfaces verified: 4/4
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
              <Card key={feature.title} className="bg-white">
                <CardHeader>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
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
                  <p className="text-xl font-semibold">
                    {plan.price}
                    <span className="text-sm font-normal text-text-secondary">
                      {" "}
                      /month
                    </span>
                  </p>
                  <ul className="mt-3 space-y-1 text-xs text-text-secondary">
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
                  <p className="text-sm">"{item.quote}"</p>
                  <p className="text-xs text-text-secondary">{item.author}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4 border-primary bg-primary text-primary-foreground">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">
                Ready to standardize your product color system?
              </p>
              <p className="text-xs text-primary-foreground/80">
                Start with one team today, scale across all surfaces next week.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                className="border-white/40 bg-white/10 text-primary-foreground hover:bg-white/20"
              >
                Talk to Sales
              </Button>
              <Button
                size="sm"
                className="bg-white text-text hover:bg-white/90"
              >
                Start Trial
              </Button>
            </div>
          </div>
          <Separator className="my-3 bg-white/25" />
          <p className="text-[11px] text-primary-foreground/70">
            SOC2-ready workflows | SSO support | Global enterprise rollout
            playbooks
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
