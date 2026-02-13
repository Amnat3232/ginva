import React from "react";
import Layout from "../components/Layout";
import Button from "../components/Button";
import Card from "../components/Card";

export default function DashboardPage() {
  // Mock data
  const user = {
    address: "0x7a2f...8e4d",
    collateral: { amount: 5.5, symbol: "SOL", value: 467.5 },
    borrowed: 330,
    ltv: 42,
    healthStatus: "safe", // safe, caution, warning, critical
    nextPayment: { days: 2, date: "15 มีนาคม" },
    monthlyInterest: 3.3,
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case "safe":
        return "text-ginva-cyan";
      case "caution":
        return "text-ginva-amber";
      case "warning":
        return "text-orange-500";
      case "critical":
        return "text-ginva-red";
      default:
        return "text-ginva-silver";
    }
  };

  const getHealthEmoji = (status: string) => {
    switch (status) {
      case "safe":
        return "🟢";
      case "caution":
        return "🟡";
      case "warning":
        return "🟠";
      case "critical":
        return "🔴";
      default:
        return "⚪";
    }
  };

  return (
    <Layout title="Dashboard - GINVA">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-display font-bold mb-1">
            ยินดีต้อนรับกลับมา, {user.address} 👋
          </h1>
          <p className="text-ginva-silver">นี่คือสภาพบัญชีของคุณ</p>
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Active Loans */}
          <div className="lg:col-span-2 space-y-6">
            {/* Active Loan Card */}
            <Card>
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <span className="mr-2">📋</span> เงินกู้ที่ใช้งานอยู่
              </h2>

              <div className="bg-ginva-slate/30 rounded-xl p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="text-3xl font-mono font-bold text-ginva-gold">
                      {user.collateral.amount} {user.collateral.symbol}
                    </div>
                    <div className="text-ginva-silver">หลักประกัน</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-mono font-bold">
                      {user.borrowed} USDC
                    </div>
                    <div className="text-ginva-silver">กู้แล้ว</div>
                  </div>
                </div>

                <div className="flex justify-between items-center py-4 border-t border-ginva-slate/30">
                  <span className="text-ginva-silver">LTV:</span>
                  <span
                    className={`font-mono font-bold ${getHealthColor(
                      user.healthStatus
                    )}`}
                  >
                    {user.ltv}% ({getHealthEmoji(user.healthStatus)} Safe Zone)
                  </span>
                </div>

                <button className="w-full mt-4 py-3 bg-ginva-slate hover:bg-ginva-slate/70 rounded-lg text-ginva-gold font-medium transition-colors">
                  จัดการเงินกู้ →
                </button>
              </div>
            </Card>

            {/* Protection Alerts */}
            <Card>
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <span className="mr-2">⚠️</span> การแจ้งเตือนการปกป้อง
              </h2>

              {/* No Alert State */}
              <div className="bg-ginva-cyan/10 border border-ginva-cyan/30 rounded-xl p-6 text-center">
                <div className="text-4xl mb-3">🛡️</div>
                <p className="text-ginva-cyan font-medium">
                  ไม่มีการแจ้งเตือนที่ใช้งานอยู่
                </p>
                <p className="text-ginva-silver text-sm mt-1">
                  สินทรัพย์ของคุณปลอดภัย
                </p>
              </div>

              {/* Example Alert (commented out)
              <div className="bg-ginva-amber/10 border border-ginva-amber/30 rounded-xl p-6">
                <div className="flex items-start space-x-3">
                  <span className="text-2xl">🚨</span>
                  <div className="flex-1">
                    <p className="text-ginva-amber font-medium">
                      SOL price dropping! 68 hours remaining
                    </p>
                    <p className="text-sm text-ginva-silver mt-1">
                      ราคา SOL ลดลง 5.8% คุณมีเวลา 68 ชั่วโมงในการดำเนินการ
                    </p>
                    <div className="flex space-x-3 mt-4">
                      <Button variant="primary" size="sm">
                        เพิ่มหลักประกัน
                      </Button>
                      <Button variant="outline" size="sm">
                        คืนบางส่วน
                      </Button>
                      <Button variant="outline" size="sm">
                        ไม่ทำอะไร
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              */}
            </Card>

            {/* Quick Actions */}
            <Card>
              <h2 className="text-xl font-semibold mb-4">การดำเนินการด่วน</h2>
              <div className="grid grid-cols-2 gap-4">
                <button className="p-4 bg-ginva-slate/50 rounded-xl hover:bg-ginva-slate/70 transition-colors text-left">
                  <div className="text-2xl mb-2">💰</div>
                  <div className="font-medium">กู้เพิ่ม</div>
                  <div className="text-sm text-ginva-silver">
                    เพิ่มวงเงินกู้
                  </div>
                </button>
                <button className="p-4 bg-ginva-slate/50 rounded-xl hover:bg-ginva-slate/70 transition-colors text-left">
                  <div className="text-2xl mb-2">💸</div>
                  <div className="font-medium">คืนเงิน</div>
                  <div className="text-sm text-ginva-silver">
                    ชำระคืนเงินกู้
                  </div>
                </button>
                <button className="p-4 bg-ginva-slate/50 rounded-xl hover:bg-ginva-slate/70 transition-colors text-left">
                  <div className="text-2xl mb-2">🏦</div>
                  <div className="font-medium">เพิ่มหลักประกัน</div>
                  <div className="text-sm text-ginva-silver">
                    เพิ่มความปลอดภัย
                  </div>
                </button>
                <button className="p-4 bg-ginva-slate/50 rounded-xl hover:bg-ginva-slate/70 transition-colors text-left">
                  <div className="text-2xl mb-2">📅</div>
                  <div className="font-medium">ต่อเวลา</div>
                  <div className="text-sm text-ginva-silver">ขยายระยะเวลา</div>
                </button>
              </div>
            </Card>
          </div>

          {/* Right Column - Account Health */}
          <div className="space-y-6">
            {/* Account Health */}
            <Card>
              <h2 className="text-xl font-semibold mb-4">สุขภาพบัญชี</h2>

              {/* Health Bar */}
              <div className="mb-6">
                <div className="w-full bg-ginva-slate rounded-full h-4 mb-2">
                  <div
                    className="bg-ginva-cyan h-4 rounded-full transition-all duration-500"
                    style={{ width: `${100 - user.ltv}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-ginva-silver">ความปลอดภัย</span>
                  <span
                    className={`font-bold ${getHealthColor(user.healthStatus)}`}
                  >
                    {getHealthEmoji(user.healthStatus)} {100 - user.ltv}%
                  </span>
                </div>
              </div>

              {/* Status */}
              <div className="text-center p-4 bg-ginva-cyan/10 rounded-xl mb-4">
                <div className="text-3xl mb-2">
                  {getHealthEmoji(user.healthStatus)}
                </div>
                <div
                  className={`font-bold ${getHealthColor(user.healthStatus)}`}
                >
                  Safe Zone
                </div>
                <div className="text-sm text-ginva-silver">
                  บัญชีของคุณอยู่ในสภาพดี
                </div>
              </div>

              {/* Next Payment */}
              <div className="border-t border-ginva-slate/30 pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-ginva-silver">
                    ดอกเบี้ี้ยครั้งต่อไป:
                  </span>
                </div>
                <div className="text-lg font-medium mb-1">
                  อีก {user.nextPayment.days} วัน
                </div>
                <div className="text-sm text-ginva-silver mb-3">
                  ({user.nextPayment.date})
                </div>
                <div className="flex justify-between items-center py-2 border-t border-ginva-slate/30">
                  <span className="text-ginva-silver">จำนวน:</span>
                  <span className="font-mono font-bold text-ginva-gold">
                    {user.monthlyInterest} USDC
                  </span>
                </div>
                <Button variant="primary" size="sm" className="w-full mt-3">
                  จ่ายตอนนี้
                </Button>
              </div>
            </Card>

            {/* Portfolio Summary */}
            <Card>
              <h2 className="text-xl font-semibold mb-4">สรุปพอร์ต</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-ginva-silver">มูลค่าหลักประกัน:</span>
                  <span className="font-mono">
                    ${user.collateral.value.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ginva-silver">เงินกู้รวม:</span>
                  <span className="font-mono">{user.borrowed} USDC</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ginva-silver">Equity:</span>
                  <span className="font-mono text-ginva-cyan">
                    ${(user.collateral.value - user.borrowed).toFixed(2)}
                  </span>
                </div>
                <div className="pt-3 border-t border-ginva-slate/30">
                  <div className="flex justify-between">
                    <span className="text-ginva-silver">ดอกเบี้ี้ยสะสม:</span>
                    <span className="font-mono text-ginva-gold">6.6 USDC</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Recent Activity */}
            <Card>
              <h2 className="text-xl font-semibold mb-4">กิจกรรมล่าสุด</h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="text-xl">💰</div>
                  <div className="flex-1">
                    <div className="font-medium">กู้เงิน</div>
                    <div className="text-sm text-ginva-silver">+330 USDC</div>
                    <div className="text-xs text-ginva-silver">
                      15 มี.ค. 2024
                    </div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="text-xl">🏦</div>
                  <div className="flex-1">
                    <div className="font-medium">ฝากหลักประกัน</div>
                    <div className="text-sm text-ginva-silver">+5.5 SOL</div>
                    <div className="text-xs text-ginva-silver">
                      15 มี.ค. 2024
                    </div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="text-xl">💸</div>
                  <div className="flex-1">
                    <div className="font-medium">จ่ายดอกเบี้ี้ย</div>
                    <div className="text-sm text-ginva-silver">-3.3 USDC</div>
                    <div className="text-xs text-ginva-silver">
                      1 มี.ค. 2024
                    </div>
                  </div>
                </div>
              </div>
              <button className="w-full mt-4 py-2 text-ginva-cyan hover:underline text-sm">
                ดูทั้งหมด →
              </button>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
