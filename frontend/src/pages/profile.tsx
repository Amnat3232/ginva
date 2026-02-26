import React, { useState } from "react";
import Layout from "../components/Layout";
import Card from "../components/Card";
import Button from "../components/Button";

interface UserProfile {
  address: string;
  displayName: string;
  email: string;
  avatar?: string;
  memberSince: string;
  tier: "bronze" | "silver" | "gold" | "platinum";
}

interface StatItem {
  label: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
}

const mockProfile: UserProfile = {
  address: "0x7a2f9c8b4d3e1f2a6c8d5e9f0a2b4c6d8e0f2a4",
  displayName: "CryptoDeFi_User",
  email: "user@example.com",
  memberSince: "January 2024",
  tier: "gold",
};

const stats: StatItem[] = [
  {
    label: "Total Collateral",
    value: "$12,450.00",
    change: "+5.2%",
    changeType: "positive",
  },
  {
    label: "Total Borrowed",
    value: "$4,200.00",
    change: "-2.1%",
    changeType: "positive",
  },
  {
    label: "Total Repaid",
    value: "$8,900.00",
    change: "+12.5%",
    changeType: "positive",
  },
  {
    label: "Interest Paid",
    value: "$342.50",
    change: "+8.3%",
    changeType: "neutral",
  },
];

const activityLog = [
  {
    action: "Borrowed",
    amount: "500 USDC",
    date: "Mar 15, 2024",
    status: "completed",
  },
  {
    action: "Deposited Collateral",
    amount: "2.5 SOL",
    date: "Mar 14, 2024",
    status: "completed",
  },
  {
    action: "Repaid",
    amount: "200 USDC",
    date: "Mar 10, 2024",
    status: "completed",
  },
  {
    action: "Added Collateral",
    amount: "1.0 SOL",
    date: "Mar 8, 2024",
    status: "completed",
  },
  {
    action: "Withdrew Collateral",
    amount: "0.5 SOL",
    date: "Mar 5, 2024",
    status: "completed",
  },
];

const settingsSections = [
  {
    title: "Notifications",
    items: [
      {
        label: "Email Alerts",
        description: "Receive email for important updates",
        enabled: true,
      },
      {
        label: "Push Notifications",
        description: "Browser push notifications",
        enabled: false,
      },
      {
        label: "SMS Alerts",
        description: "Text message for critical events",
        enabled: false,
      },
    ],
  },
  {
    title: "Security",
    items: [
      {
        label: "Two-Factor Authentication",
        description: "Add extra security to your account",
        enabled: true,
      },
      {
        label: "Transaction Confirmations",
        description: "Confirm each transaction",
        enabled: true,
      },
      {
        label: "Trusted Addresses",
        description: "Manage whitelisted addresses",
        enabled: false,
      },
    ],
  },
  {
    title: "Preferences",
    items: [
      { label: "Dark Mode", description: "Use dark theme", enabled: true },
      {
        label: "Compact View",
        description: "Show more data in less space",
        enabled: false,
      },
      {
        label: "Auto-refresh",
        description: "Automatically update data",
        enabled: true,
      },
    ],
  },
];

const tierColors = {
  bronze: "from-amber-700 to-amber-900",
  silver: "from-gray-300 to-gray-400",
  gold: "from-yellow-400 to-yellow-600",
  platinum: "from-purple-400 to-purple-600",
};

const tierBadge = {
  bronze: "bg-amber-700/20 text-amber-400 border-amber-700/30",
  silver: "bg-gray-400/20 text-gray-300 border-gray-400/30",
  gold: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  platinum: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

export default function ProfilePage() {
  const [activeSection, setActiveSection] = useState<string>("profile");

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatAddress = (address: string): string => {
    return `${address.slice(0, 10)}...${address.slice(-8)}`;
  };

  return (
    <Layout title="Profile - GINVA">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-display font-bold mb-2">
            Profile Settings
          </h1>
          <p className="text-ginva-silver">
            Manage your account and preferences
          </p>
        </div>

        {/* Profile Card */}
        <Card className="mb-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-ginva-cyan to-ginva-gold flex items-center justify-center text-4xl sm:text-5xl">
                {mockProfile.displayName.charAt(0).toUpperCase()}
              </div>
              <div
                className={`absolute -bottom-1 -right-1 px-3 py-1 rounded-full text-xs font-semibold border ${
                  tierBadge[mockProfile.tier]
                }`}
              >
                {mockProfile.tier.toUpperCase()}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row items-center gap-2 mb-2">
                <h2 className="text-xl sm:text-2xl font-semibold">
                  {mockProfile.displayName}
                </h2>
                <span
                  className={`hidden sm:inline-block px-2 py-0.5 rounded text-xs font-medium bg-gradient-to-r ${
                    tierColors[mockProfile.tier]
                  } text-white`}
                >
                  {mockProfile.tier}
                </span>
              </div>

              {/* Address */}
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-3">
                <code className="text-sm text-ginva-silver bg-ginva-navy px-3 py-1 rounded">
                  {formatAddress(mockProfile.address)}
                </code>
                <button
                  onClick={() => copyToClipboard(mockProfile.address)}
                  className="p-2 text-ginva-silver hover:text-ginva-cyan transition-colors cursor-pointer"
                  aria-label="Copy address to clipboard"
                  title="Copy address"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </button>
              </div>

              <p className="text-sm text-ginva-silver">
                Member since {mockProfile.memberSince}
              </p>
            </div>

            {/* Edit Button */}
            <Button variant="outline" size="sm" className="w-full sm:w-auto">
              <svg
                className="w-4 h-4 mr-2 inline"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
              Edit Profile
            </Button>
          </div>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {stats.map((stat, index) => (
            <Card key={index} hover={false}>
              <p className="text-sm text-ginva-silver mb-1">{stat.label}</p>
              <p className="text-xl sm:text-2xl font-mono font-bold text-ginva-gold">
                {stat.value}
              </p>
              {stat.change && (
                <p
                  className={`text-xs mt-1 ${
                    stat.changeType === "positive"
                      ? "text-ginva-cyan"
                      : stat.changeType === "negative"
                      ? "text-ginva-red"
                      : "text-ginva-silver"
                  }`}
                >
                  {stat.change}
                </p>
              )}
            </Card>
          ))}
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {settingsSections.map((section) => (
            <Card key={section.title}>
              <h3 className="text-lg font-semibold mb-4">{section.title}</h3>
              <div className="space-y-4">
                {section.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-3 border-b border-ginva-slate/30 last:border-0"
                  >
                    <div className="flex-1 pr-4">
                      <p className="font-medium">{item.label}</p>
                      <p className="text-sm text-ginva-silver">
                        {item.description}
                      </p>
                    </div>
                    <button
                      role="switch"
                      aria-checked={item.enabled}
                      aria-label={item.label}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-ginva-cyan focus:ring-offset-2 focus:ring-offset-ginva-navy ${
                        item.enabled ? "bg-ginva-cyan" : "bg-ginva-slate"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform cursor-pointer ${
                          item.enabled ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>

        {/* Activity Log */}
        <Card className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Activity Log</h3>
            <button className="text-sm text-ginva-cyan hover:underline cursor-pointer">
              View All
            </button>
          </div>
          <div className="space-y-4">
            {activityLog.map((activity, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-3 border-b border-ginva-slate/30 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-ginva-cyan/20 flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-ginva-cyan"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium">{activity.action}</p>
                    <p className="text-sm text-ginva-silver">{activity.date}</p>
                  </div>
                </div>
                <span className="font-mono text-ginva-gold">
                  {activity.amount}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Danger Zone */}
        <Card className="mt-6 border-ginva-red/30">
          <h3 className="text-lg font-semibold text-ginva-red mb-4">
            Danger Zone
          </h3>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              variant="outline"
              className="border-ginva-red/50 text-ginva-red hover:bg-ginva-red/10"
            >
              <svg
                className="w-4 h-4 mr-2 inline"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Reset Account
            </Button>
            <Button
              variant="outline"
              className="border-ginva-red/50 text-ginva-red hover:bg-ginva-red/10"
            >
              <svg
                className="w-4 h-4 mr-2 inline"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Disconnect Wallet
            </Button>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
