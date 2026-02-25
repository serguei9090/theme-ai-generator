import { Avatar, AvatarFallback } from "../atoms/avatar";
import { Badge } from "../atoms/badge";
import { Button } from "../atoms/button";
import { Card, CardContent } from "../atoms/card";
import { Progress } from "../atoms/progress";
import { MockSectionTitle, PhoneFrame, type ScreenPattern } from "./_shared";

const SCREEN_PATTERNS: ScreenPattern[] = [
  {
    id: "profile",
    title: "Profile Dashboard",
    subtitle: "Creator metrics and content buckets",
    cta: "View Portfolio",
  },
  {
    id: "commerce",
    title: "Commerce Catalog",
    subtitle: "Product cards with quick purchase actions",
    cta: "Checkout",
  },
  {
    id: "social",
    title: "Social Feed",
    subtitle: "Posts, reactions, and community updates",
    cta: "Create Post",
  },
  {
    id: "wallet",
    title: "Wallet & Support",
    subtitle: "Balance, transactions, and help entry points",
    cta: "Open Support",
  },
];

const TIMES = ["9:41", "10:30", "11:18", "12:02"];

export default function MobileAppMockup() {
  return (
    <div className="w-full rounded-xl border border-border bg-background p-4 text-text">
      <MockSectionTitle
        eyebrow="Mobile Pattern Gallery"
        title="Four enterprise-ready mobile directions"
        description="Each screen tests palette behavior across cards, badges, CTA buttons, and metadata blocks."
        trailing={<Badge variant="outline">4 screens</Badge>}
      />

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <PhoneFrame statusTime={TIMES[0]} label="Profile">
          <Card className="border-0 bg-primary text-primary-foreground">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback>MH</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-xs font-semibold">Marry Hart</p>
                    <p className="text-[10px] text-primary-foreground/80">
                      Design Lead
                    </p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className="border-white/30 bg-white/10 text-primary-foreground"
                >
                  Pro
                </Badge>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-1 text-center text-[10px]">
                <div>
                  <p className="text-sm font-semibold">648</p>
                  <p>Following</p>
                </div>
                <div>
                  <p className="text-sm font-semibold">8</p>
                  <p>Buckets</p>
                </div>
                <div>
                  <p className="text-sm font-semibold">1052</p>
                  <p>Followers</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="mt-2 flex flex-wrap gap-1">
            <Badge variant="secondary">Principle</Badge>
            <Badge variant="accent">Interface</Badge>
            <Badge>Web App</Badge>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <div className="h-14 rounded-md bg-secondary/30" />
            <div className="h-14 rounded-md bg-accent/25" />
            <div className="h-14 rounded-md bg-primary/20" />
            <div className="h-14 rounded-md bg-secondary/20" />
          </div>
          <Button size="sm" className="mt-2 w-full">
            {SCREEN_PATTERNS[0].cta}
          </Button>
        </PhoneFrame>

        <PhoneFrame statusTime={TIMES[1]} label="Shop">
          <Card className="border-0 bg-primary text-primary-foreground">
            <CardContent className="p-3">
              <p className="text-xs font-semibold">
                {SCREEN_PATTERNS[1].title}
              </p>
              <p className="text-[10px] text-primary-foreground/80">
                {SCREEN_PATTERNS[1].subtitle}
              </p>
              <div className="mt-2 rounded-md bg-white/15 px-2 py-1 text-[10px]">
                Search products...
              </div>
            </CardContent>
          </Card>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {[
              ["Classic Tee", "$68"],
              ["Summer Shirt", "$77"],
            ].map(([name, price]) => (
              <Card key={name} className="bg-white">
                <CardContent className="p-2">
                  <div className="h-8 rounded bg-secondary/30" />
                  <p className="mt-1 text-[10px]">{name}</p>
                  <div className="mt-1 flex items-center justify-between">
                    <p className="text-[11px] font-semibold">{price}</p>
                    <Button size="sm" className="h-6 px-2 text-[10px]">
                      Add
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Button size="sm" variant="outline" className="mt-2 w-full">
            {SCREEN_PATTERNS[1].cta}
          </Button>
        </PhoneFrame>

        <PhoneFrame statusTime={TIMES[2]} label="Social">
          <Card className="border-0 bg-primary text-primary-foreground">
            <CardContent className="p-3">
              <p className="text-xs font-semibold">
                {SCREEN_PATTERNS[2].title}
              </p>
              <p className="text-[10px] text-primary-foreground/80">
                {SCREEN_PATTERNS[2].subtitle}
              </p>
            </CardContent>
          </Card>
          <div className="mt-2 flex gap-1">
            {["NA", "KM", "LA", "AT"].map((name) => (
              <Avatar key={name} className="h-6 w-6">
                <AvatarFallback>{name}</AvatarFallback>
              </Avatar>
            ))}
          </div>
          <Card className="mt-2 bg-white">
            <CardContent className="p-2">
              <p className="text-[10px] text-text-secondary">
                Design Ops Update
              </p>
              <p className="mt-1 text-[11px]">
                Launch day notes and palette refinements for version 2.1.
              </p>
              <div className="mt-2 h-9 rounded bg-accent/20" />
              <div className="mt-2 flex items-center justify-between text-[10px] text-text-secondary">
                <span>24 likes</span>
                <span>8 comments</span>
              </div>
            </CardContent>
          </Card>
          <Button size="sm" className="mt-2 w-full">
            {SCREEN_PATTERNS[2].cta}
          </Button>
        </PhoneFrame>

        <PhoneFrame statusTime={TIMES[3]} label="Wallet">
          <Card className="border-0 bg-primary text-primary-foreground">
            <CardContent className="p-3">
              <p className="text-[10px]">Current Balance</p>
              <p className="mt-1 text-sm font-semibold">$18,320.25</p>
              <div className="mt-2 flex gap-1">
                <Badge
                  variant="outline"
                  className="border-white/30 bg-white/10 text-primary-foreground"
                >
                  Send
                </Badge>
                <Badge
                  variant="outline"
                  className="border-white/30 bg-white/10 text-primary-foreground"
                >
                  Request
                </Badge>
                <Badge
                  variant="outline"
                  className="border-white/30 bg-white/10 text-primary-foreground"
                >
                  Top up
                </Badge>
              </div>
            </CardContent>
          </Card>
          <div className="mt-2 space-y-1">
            {[
              ["Subscription", "-$18.00", 20],
              ["Transport", "-$12.40", 38],
              ["Salary", "+$2,450.00", 82],
            ].map(([label, amount, progress]) => (
              <Card key={label} className="bg-white">
                <CardContent className="space-y-1 p-2">
                  <div className="flex items-center justify-between text-[10px]">
                    <span>{label}</span>
                    <span className="font-medium">{amount}</span>
                  </div>
                  <Progress value={Number(progress)} />
                </CardContent>
              </Card>
            ))}
          </div>
          <Button size="sm" variant="outline" className="mt-2 w-full">
            {SCREEN_PATTERNS[3].cta}
          </Button>
        </PhoneFrame>
      </div>
    </div>
  );
}
