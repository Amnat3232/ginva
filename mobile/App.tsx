import "react-native-get-random-values";
import { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import * as Web3 from "@solana/web3.js";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const COLORS = {
  background: "#0a0e17",
  card: "rgba(15, 23, 42, 0.7)",
  accent: "#10b981",
  accentLight: "rgba(16, 185, 129, 0.15)",
  text: "#ffffff",
  textMuted: "rgba(255, 255, 255, 0.5)",
  border: "rgba(16, 185, 129, 0.2)",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#3b82f6",
};

const PROGRAM_ID = "6U1QUPxGuWLU9jizzcJiLsKzZU6LT95FzihaVzLsk8xU";
const DEVNET_ENDPOINT = "https://api.devnet.solana.com";

const connection = new Web3.Connection(DEVNET_ENDPOINT);

interface GlassCardProps {
  children: React.ReactNode;
  style?: object;
}

const GlassCard: React.FC<GlassCardProps> = ({ children, style }) => (
  <View style={[styles.glassCard, style]}>
    <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill}>
      <View style={styles.cardContent}>{children}</View>
    </BlurView>
  </View>
);

const Button: React.FC<{
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline";
  style?: object;
  loading?: boolean;
}> = ({ title, onPress, variant = "primary", style, loading }) => {
  const buttonStyle = [
    styles.button,
    variant === "primary" && styles.buttonPrimary,
    variant === "secondary" && styles.buttonSecondary,
    variant === "outline" && styles.buttonOutline,
    style,
  ];

  return (
    <Pressable onPress={onPress} style={buttonStyle} disabled={loading}>
      {loading ? (
        <ActivityIndicator
          color={variant === "outline" ? COLORS.accent : "white"}
        />
      ) : (
        <Text
          style={[
            styles.buttonText,
            variant === "outline" && { color: COLORS.accent },
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
};

const TabIcon = ({ name, focused }: { name: string; focused: boolean }) => (
  <Ionicons
    name={name as any}
    size={24}
    color={focused ? COLORS.accent : COLORS.textMuted}
  />
);

const DashboardScreen = () => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [tvl, setTvl] = useState(0);
  const [activeLoans, setActiveLoans] = useState(0);
  const [prices, setPrices] = useState({ sol: 0, btc: 0, eth: 0 });
  const [loadingPrices, setLoadingPrices] = useState(true);

  useEffect(() => {
    fetchPrices();
    fetchProtocolData();
  }, []);

  const fetchPrices = async () => {
    try {
      setLoadingPrices(true);
      // Using simple price fetch - in production use Pyth or similar
      setPrices({ sol: 98.5, btc: 42500, eth: 1850 });
    } catch (e) {
      console.log("Price fetch error:", e);
    } finally {
      setLoadingPrices(false);
    }
  };

  const fetchProtocolData = async () => {
    try {
      const programId = new Web3.PublicKey(PROGRAM_ID);
      const configPda = Web3.PublicKey.findProgramAddressSync(
        [Buffer.from("config")],
        programId
      )[0];

      // Simplified - would need actual program interaction
      setTvl(125000);
      setActiveLoans(42);
    } catch (e) {
      console.log("Data fetch error:", e);
    }
  };

  const connectWallet = async () => {
    setConnecting(true);
    // Mobile wallet connection would go here
    // Using @solana-mobile/mobile-wallet-adapter-protocol
    setTimeout(() => {
      setWalletAddress("7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU");
      setConnecting(false);
    }, 1500);
  };

  const disconnectWallet = () => {
    setWalletAddress(null);
  };

  const statCards = [
    {
      label: "Total Value Locked",
      value: `$${tvl.toLocaleString()}`,
      icon: "wallet",
    },
    {
      label: "Active Loans",
      value: activeLoans.toString(),
      icon: "document-text",
    },
    { label: "Your Loans", value: "0", icon: "card" },
    { label: "Protection", value: "Dual", icon: "shield-checkmark" },
  ];

  return (
    <ScrollView style={styles.screen} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Portfolio</Text>
        <Text style={styles.headerSubtitle}>
          {walletAddress
            ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
            : "Connect your wallet"}
        </Text>
      </View>

      {/* Balance Card */}
      <GlassCard style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Total Balance</Text>
        <Text style={styles.balanceValue}>$0.00</Text>
        <View style={styles.buttonRow}>
          <Pressable style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Borrow USDC</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Earn Yield</Text>
          </Pressable>
        </View>
      </GlassCard>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {statCards.map((stat, index) => (
          <GlassCard key={index} style={styles.statCard}>
            <MaterialCommunityIcons
              name={stat.icon as any}
              size={20}
              color={COLORS.accent}
              style={{ marginBottom: 8 }}
            />
            <Text style={styles.statLabel}>{stat.label}</Text>
            <Text style={styles.statValue}>{stat.value}</Text>
          </GlassCard>
        ))}
      </View>

      {/* Market Prices */}
      <GlassCard style={styles.pricesCard}>
        <Text style={styles.sectionTitle}>Market Prices</Text>
        <View style={styles.pricesRow}>
          <View style={styles.priceItem}>
            <Text style={styles.priceLabel}>SOL</Text>
            <Text style={styles.priceValue}>
              {loadingPrices ? "..." : `$${prices.sol.toFixed(2)}`}
            </Text>
          </View>
          <View style={styles.priceItem}>
            <Text style={styles.priceLabel}>BTC</Text>
            <Text style={[styles.priceValue, { color: "#f7931a" }]}>
              {loadingPrices ? "..." : `$${prices.btc.toLocaleString()}`}
            </Text>
          </View>
          <View style={styles.priceItem}>
            <Text style={styles.priceLabel}>ETH</Text>
            <Text style={[styles.priceValue, { color: "#627eea" }]}>
              {loadingPrices ? "..." : `$${prices.eth.toLocaleString()}`}
            </Text>
          </View>
        </View>
      </GlassCard>

      {/* Portfolio Tabs */}
      <GlassCard style={styles.portfolioCard}>
        <View style={styles.tabRow}>
          {["Tokens", "NFTs", "Collectibles"].map((tab, index) => (
            <Pressable
              key={tab}
              style={[styles.tab, index === 0 && styles.tabActive]}
            >
              <Text
                style={[styles.tabText, index === 0 && styles.tabTextActive]}
              >
                {tab}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="wallet-outline" size={40} color={COLORS.textMuted} />
          <Text style={styles.emptyText}>
            {walletAddress
              ? "No assets found"
              : "Connect wallet to view assets"}
          </Text>
        </View>
      </GlassCard>

      {/* Connect Button */}
      {!walletAddress && (
        <Pressable style={styles.connectButton} onPress={connectWallet}>
          <Ionicons name="wallet" size={20} color="white" />
          <Text style={styles.connectButtonText}>
            {connecting ? "Connecting..." : "Connect Wallet"}
          </Text>
        </Pressable>
      )}

      {walletAddress && (
        <Pressable style={styles.disconnectButton} onPress={disconnectWallet}>
          <Text style={styles.disconnectButtonText}>Disconnect</Text>
        </Pressable>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>GINVA v2.0.0 • Devnet</Text>
      </View>
    </ScrollView>
  );
};

const BorrowScreen = () => {
  const [collateral, setCollateral] = useState("");
  const [borrowAmount, setBorrowAmount] = useState("");
  const [term, setTerm] = useState("30");

  const maxBorrow = collateral ? parseFloat(collateral) * 0.5 : 0;

  return (
    <ScrollView style={styles.screen} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Borrow</Text>
        <Text style={styles.headerSubtitle}>Use your crypto as collateral</Text>
      </View>

      <GlassCard style={styles.formCard}>
        <Text style={styles.inputLabel}>Collateral Amount (SOL)</Text>
        <TextInput
          style={styles.input}
          value={collateral}
          onChangeText={setCollateral}
          placeholder="0.00"
          placeholderTextColor={COLORS.textMuted}
          keyboardType="decimal-pad"
        />

        <Text style={[styles.inputLabel, { marginTop: 20 }]}>
          Borrow Amount (USDC)
        </Text>
        <TextInput
          style={styles.input}
          value={borrowAmount}
          onChangeText={setBorrowAmount}
          placeholder="0.00"
          placeholderTextColor={COLORS.textMuted}
          keyboardType="decimal-pad"
        />
        <Text style={styles.helperText}>
          Max: ${maxBorrow.toFixed(2)} USDC (50% LTV)
        </Text>

        <Text style={[styles.inputLabel, { marginTop: 20 }]}>Loan Term</Text>
        <View style={styles.termRow}>
          {["7", "14", "30", "60", "90"].map((t) => (
            <Pressable
              key={t}
              style={[styles.termButton, term === t && styles.termButtonActive]}
              onPress={() => setTerm(t)}
            >
              <Text
                style={[
                  styles.termButtonText,
                  term === t && styles.termButtonTextActive,
                ]}
              >
                {t}d
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Loan Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Health Factor</Text>
            <Text style={[styles.summaryValue, { color: COLORS.accent }]}>
              200%
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Interest Rate</Text>
            <Text style={styles.summaryValue}>12% APR</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Liquidation</Text>
            <Text style={[styles.summaryValue, { color: COLORS.warning }]}>
              Below 100%
            </Text>
          </View>
        </View>

        <Pressable style={styles.submitButton}>
          <Text style={styles.submitButtonText}>Create Loan</Text>
        </Pressable>
      </GlassCard>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Dual Protection: 72h + Immediate</Text>
      </View>
    </ScrollView>
  );
};

const EarnScreen = () => {
  const [depositAmount, setDepositAmount] = useState("");

  return (
    <ScrollView style={styles.screen} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Earn</Text>
        <Text style={styles.headerSubtitle}>Stake USDC and earn yield</Text>
      </View>

      <GlassCard style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Your Staked Balance</Text>
        <Text style={styles.balanceValue}>$0.00</Text>
        <Text style={styles.aprText}>Current APR: 8.5%</Text>
      </GlassCard>

      <GlassCard style={styles.formCard}>
        <Text style={styles.inputLabel}>Amount to Stake (USDC)</Text>
        <TextInput
          style={styles.input}
          value={depositAmount}
          onChangeText={setDepositAmount}
          placeholder="0.00"
          placeholderTextColor={COLORS.textMuted}
          keyboardType="decimal-pad"
        />

        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color={COLORS.info} />
          <Text style={styles.infoText}>
            Earn yield on your USDC while maintaining exposure to Solana lending
            pool.
          </Text>
        </View>

        <Pressable style={styles.submitButton}>
          <Text style={styles.submitButtonText}>Stake USDC</Text>
        </Pressable>
      </GlassCard>

      <GlassCard style={styles.yieldCard}>
        <Text style={styles.sectionTitle}>Yield Pool Stats</Text>
        <View style={styles.yieldRow}>
          <Text style={styles.yieldLabel}>Total Deposited</Text>
          <Text style={styles.yieldValue}>$540,000 USDC</Text>
        </View>
        <View style={styles.yieldRow}>
          <Text style={styles.yieldLabel}>Active Depositors</Text>
          <Text style={styles.yieldValue}>128</Text>
        </View>
        <View style={styles.yieldRow}>
          <Text style={styles.yieldLabel}>Pool APY</Text>
          <Text style={[styles.yieldValue, { color: COLORS.accent }]}>
            8.5%
          </Text>
        </View>
      </GlassCard>
    </ScrollView>
  );
};

const MoreScreen = () => {
  const menuItems = [
    { icon: "ticket", label: "My Tickets", badge: "0" },
    { icon: "swap-horizontal", label: "Redeem" },
    { icon: "storefront", label: "Store" },
    { icon: "flash", label: "Keeper", color: COLORS.warning },
    { icon: "person", label: "Agent", color: "#8b5cf6" },
    { icon: "settings", label: "Settings" },
  ];

  return (
    <ScrollView style={styles.screen} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>More</Text>
      </View>

      <GlassCard style={styles.menuCard}>
        {menuItems.map((item, index) => (
          <Pressable key={item.label} style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <MaterialCommunityIcons
                name={item.icon as any}
                size={22}
                color={item.color || COLORS.text}
              />
              <Text style={styles.menuItemText}>{item.label}</Text>
            </View>
            <View style={styles.menuItemRight}>
              {item.badge && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.badge}</Text>
                </View>
              )}
              <Ionicons
                name="chevron-forward"
                size={20}
                color={COLORS.textMuted}
              />
            </View>
          </Pressable>
        ))}
      </GlassCard>

      <GlassCard style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Network</Text>
          <Text style={[styles.infoValue, { color: COLORS.accent }]}>
            Devnet
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Program ID</Text>
          <Text style={[styles.infoValue, { fontSize: 10 }]} numberOfLines={1}>
            {PROGRAM_ID.slice(0, 8)}...
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Version</Text>
          <Text style={styles.infoValue}>2.0.0</Text>
        </View>
      </GlassCard>
    </ScrollView>
  );
};

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: COLORS.accent,
          tabBarInactiveTintColor: COLORS.textMuted,
          tabBarLabelStyle: styles.tabBarLabel,
        }}
      >
        <Tab.Screen
          name="Portfolio"
          component={DashboardScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon
                name={focused ? "wallet" : "wallet-outline"}
                focused={focused}
              />
            ),
          }}
        />
        <Tab.Screen
          name="Borrow"
          component={BorrowScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon
                name={
                  focused ? "arrow-down-circle" : "arrow-down-circle-outline"
                }
                focused={focused}
              />
            ),
          }}
        />
        <Tab.Screen
          name="Earn"
          component={EarnScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon
                name={focused ? "trending-up" : "trending-up-outline"}
                focused={focused}
              />
            ),
          }}
        />
        <Tab.Screen
          name="More"
          component={MoreScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon
                name={focused ? "menu" : "menu-outline"}
                focused={focused}
              />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 16,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  glassCard: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardContent: {
    padding: 16,
  },
  balanceCard: {
    padding: 24,
  },
  balanceLabel: {
    fontSize: 14,
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  balanceValue: {
    fontSize: 42,
    fontWeight: "700",
    color: COLORS.text,
    marginVertical: 8,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: COLORS.accent,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 15,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: "transparent",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  secondaryButtonText: {
    color: COLORS.text,
    fontWeight: "600",
    fontSize: 15,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 8,
  },
  statCard: {
    width: (SCREEN_WIDTH - 44) / 2,
    padding: 14,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
  },
  pricesCard: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 16,
  },
  pricesRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  priceItem: {
    alignItems: "center",
  },
  priceLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.accent,
  },
  portfolioCard: {
    padding: 0,
    overflow: "hidden",
  },
  tabRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: COLORS.accent,
    backgroundColor: COLORS.accentLight,
  },
  tabText: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: "500",
  },
  tabTextActive: {
    color: COLORS.accent,
    fontWeight: "600",
  },
  emptyState: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    color: COLORS.textMuted,
    marginTop: 12,
    fontSize: 14,
  },
  connectButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 16,
  },
  connectButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  disconnectButton: {
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.4)",
    marginBottom: 16,
  },
  disconnectButtonText: {
    color: "#ef4444",
    fontWeight: "600",
    fontSize: 15,
  },
  footer: {
    paddingVertical: 20,
    alignItems: "center",
  },
  footerText: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  formCard: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  helperText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 6,
  },
  termRow: {
    flexDirection: "row",
    gap: 8,
  },
  termButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  termButtonActive: {
    backgroundColor: COLORS.accentLight,
    borderColor: COLORS.accent,
  },
  termButtonText: {
    color: COLORS.textMuted,
    fontWeight: "500",
  },
  termButtonTextActive: {
    color: COLORS.accent,
    fontWeight: "600",
  },
  summaryCard: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  summaryLabel: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
  summaryValue: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "600",
  },
  submitButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 24,
  },
  submitButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  aprText: {
    color: COLORS.accent,
    fontSize: 16,
    fontWeight: "600",
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    padding: 12,
    borderRadius: 10,
    marginTop: 16,
  },
  infoText: {
    flex: 1,
    color: COLORS.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  yieldCard: {
    padding: 16,
  },
  yieldRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  yieldLabel: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
  yieldValue: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "600",
  },
  menuCard: {
    padding: 0,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  menuItemText: {
    color: COLORS.text,
    fontSize: 16,
  },
  menuItemRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  badge: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  infoCard: {
    padding: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  infoLabel: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
  infoValue: {
    color: COLORS.text,
    fontSize: 14,
  },
  tabBar: {
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 8,
    paddingBottom: 8,
    height: 70,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: "500",
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonPrimary: {
    backgroundColor: COLORS.accent,
  },
  buttonSecondary: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  buttonOutline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 15,
  },
});
