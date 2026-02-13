import React, { useState } from "react";
import Layout from "../components/Layout";
import Button from "../components/Button";
import Card from "../components/Card";

export default function SupporterPage() {
  const [stakeAmount, setStakeAmount] = useState(1000);
  const [activeTab, setActiveTab] = useState("overview");

  // Mock data
  const supporterData = {
    totalStaked: 5000,
    earnedToDate: 234.5,
    apy: 12.4,
    autoCompound: true,
    last30Days: {
      supporterShare: 152.8,
      operations: 58.0,
      capitalPool: 23.7,
      totalProtocol: 234.5,
    },
    monthlyHistory: [
      { month: "มี.ค.", earnings: 78.5 },
      { month: "ก.พ.", earnings: 72.3 },
      { month: "ม.ค.", earnings: 83.7 },
    ],
  };

  // Calculate projected earnings
  const projectedYearly = stakeAmount * (supporterData.apy / 100);
  const projectedMonthly = projectedYearly / 12;

  return (
    <Layout title="ศูนย์ผู้สนับสนุน - GINVA">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <span className="text-4xl">💰</span>
            <div>
              <h1 className="text-3xl font-display font-bold">
                ศูนย์ผู้สนับสนุน
              </h1>
              <p className="text-ginva-gold">เส้นเลือดใหญ่ของระบบนิเวศ</p>
            </div>
          </div>
          <p className="text-ginva-silver max-w-2xl">
            คุณคือ "เส้นเลือดใหญ่" ที่ส่งเลือด (สภาพคล่อง) ไปเลี้ยงทุกส่วนของ
            GINVA ไม่มีคุณ ระบบจะเหี่ยวเฉา
          </p>
        </div>

        {/* Main Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-ginva-gold/20 to-ginva-navy border-ginva-gold/50">
            <div className="text-sm text-ginva-silver mb-1">Stake ของคุณ</div>
            <div className="text-4xl font-mono font-bold text-ginva-gold">
              {supporterData.totalStaked.toLocaleString()} USDC
            </div>
            <div className="text-sm text-ginva-cyan mt-2">
              ได้รับแล้ว: +{supporterData.earnedToDate} USDC
            </div>
          </Card>

          <Card>
            <div className="text-sm text-ginva-silver mb-1">APY ปัจจุบัน</div>
            <div className="text-4xl font-mono font-bold text-ginva-cyan">
              {supporterData.apy}%
            </div>
            <div className="text-sm text-ginva-silver mt-2">
              ทบต้นอัตโนมัติ: {supporterData.autoCompound ? "ON 🔄" : "OFF"}
            </div>
          </Card>

          <Card>
            <div className="text-sm text-ginva-silver mb-1">รายได้เดือนนี้</div>
            <div className="text-4xl font-mono font-bold text-ginva-gold">
              {supporterData.last30Days.supporterShare.toFixed(2)} USDC
            </div>
            <div className="text-sm text-ginva-silver mt-2">
              ~{(supporterData.last30Days.supporterShare / 30).toFixed(2)}{" "}
              USDC/วัน
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-6 border-b border-ginva-slate">
          {[
            { id: "overview", label: "ภาพรวม" },
            { id: "revenue", label: "การแบ่งรายได้" },
            { id: "stake", label: "จัดการ Stake" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 px-4 font-medium transition-colors ${
                activeTab === tab.id
                  ? "text-ginva-gold border-b-2 border-ginva-gold"
                  : "text-ginva-silver hover:text-ginva-gold"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Revenue Breakdown */}
            <Card>
              <h2 className="text-xl font-semibold mb-6">
                การแบ่งรายได้ (30 วันล่าสุด)
              </h2>

              <div className="space-y-4">
                {/* Supporter Share */}
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-ginva-silver">
                      ส่วนของคุณ (65.25%)
                    </span>
                    <span className="font-mono font-bold text-ginva-gold">
                      ${supporterData.last30Days.supporterShare.toFixed(2)}
                    </span>
                  </div>
                  <div className="w-full bg-ginva-slate rounded-full h-3">
                    <div
                      className="bg-ginva-gold h-3 rounded-full"
                      style={{ width: "65.25%" }}
                    />
                  </div>
                </div>

                {/* Operations */}
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-ginva-silver">
                      ทีมดำเนินการ (24.75%)
                    </span>
                    <span className="font-mono">
                      ${supporterData.last30Days.operations.toFixed(2)}
                    </span>
                  </div>
                  <div className="w-full bg-ginva-slate rounded-full h-3">
                    <div
                      className="bg-ginva-silver h-3 rounded-full"
                      style={{ width: "24.75%" }}
                    />
                  </div>
                </div>

                {/* Capital Pool */}
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-ginva-silver">
                      กองทุนสภาพคล่อง (10%)
                    </span>
                    <span className="font-mono">
                      ${supporterData.last30Days.capitalPool.toFixed(2)}
                    </span>
                  </div>
                  <div className="w-full bg-ginva-slate rounded-full h-3">
                    <div
                      className="bg-ginva-cyan h-3 rounded-full"
                      style={{ width: "10%" }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-ginva-slate">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">รายได้รวมของโปรโตคอล:</span>
                  <span className="font-mono font-bold text-xl text-ginva-gold">
                    ${supporterData.last30Days.totalProtocol.toFixed(2)}
                  </span>
                </div>
              </div>
            </Card>

            {/* Monthly History */}
            <Card>
              <h2 className="text-xl font-semibold mb-6">
                ประวัติรายได้รายเดือน
              </h2>

              <div className="space-y-4">
                {supporterData.monthlyHistory.map((month, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-ginva-slate/30 rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-full bg-ginva-gold/20 flex items-center justify-center">
                        <span className="text-ginva-gold font-bold">
                          {month.month}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium">เดือน {month.month}</div>
                        <div className="text-sm text-ginva-silver">
                          รายได้จากดอกเบี้ย
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-ginva-gold text-lg">
                        +{month.earnings} USDC
                      </div>
                      <div className="text-sm text-ginva-cyan">
                        +
                        {(
                          (month.earnings / supporterData.totalStaked) *
                          100
                        ).toFixed(1)}
                        %
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button className="w-full mt-4 py-3 text-ginva-cyan hover:underline">
                ดูประวัติทั้งหมด →
              </button>
            </Card>
          </div>
        )}

        {activeTab === "revenue" && (
          <Card>
            <h2 className="text-xl font-semibold mb-6">
              รายละเอียดการแบ่งรายได้
            </h2>

            <div className="prose prose-invert max-w-none">
              <p className="text-ginva-silver mb-6">
                ทุกครั้งที่มีผู้กู้จ่ายดอกเบี้ย รายได้จะถูกแบ่งตามสัดส่วนดังนี้:
              </p>

              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="p-6 bg-ginva-gold/10 rounded-xl border border-ginva-gold/30">
                  <div className="text-3xl mb-3">👥</div>
                  <h3 className="font-semibold text-ginva-gold mb-2">
                    ผู้สนับสนุน 65.25%
                  </h3>
                  <p className="text-sm text-ginva-silver">
                    ส่วนแบ่งที่มากที่สุดสำหรับผู้ที่สนับสนุนสภาพคล่อง
                  </p>
                </div>

                <div className="p-6 bg-ginva-slate/50 rounded-xl">
                  <div className="text-3xl mb-3">🛠️</div>
                  <h3 className="font-semibold mb-2">ทีมดำเนินการ 24.75%</h3>
                  <p className="text-sm text-ginva-silver">
                    สำหรับพัฒนาและดูแลระบบ
                  </p>
                </div>

                <div className="p-6 bg-ginva-slate/50 rounded-xl">
                  <div className="text-3xl mb-3">🏦</div>
                  <h3 className="font-semibold mb-2">กองทุนสภาพคล่อง 10%</h3>
                  <p className="text-sm text-ginva-silver">
                    บัฟเฟอร์สำหรับความมั่นคงของระบบ
                  </p>
                </div>
              </div>

              <div className="bg-ginva-cyan/10 border border-ginva-cyan/30 rounded-xl p-6">
                <h3 className="font-semibold text-ginva-cyan mb-3">
                  💡 ตัวอย่าง:
                </h3>
                <p className="text-ginva-silver">
                  ถ้าผู้กู้จ่ายดอกเบี้ย{" "}
                  <span className="text-ginva-gold font-mono">100 USDC</span>:
                </p>
                <ul className="mt-4 space-y-2 text-ginva-silver">
                  <li>
                    • คุณได้รับ:{" "}
                    <span className="text-ginva-gold font-mono">
                      65.25 USDC
                    </span>
                  </li>
                  <li>
                    • ทีมงาน: <span className="font-mono">24.75 USDC</span>
                  </li>
                  <li>
                    • กองทุน: <span className="font-mono">10 USDC</span>
                  </li>
                </ul>
              </div>
            </div>
          </Card>
        )}

        {activeTab === "stake" && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Stake Calculator */}
            <Card>
              <h2 className="text-xl font-semibold mb-6">คำนวณรายได้</h2>

              <div className="mb-6">
                <label className="block text-sm text-ginva-silver mb-2">
                  จำนวน USDC ที่ต้องการ Stake
                </label>
                <input
                  type="range"
                  min="100"
                  max="100000"
                  step="100"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(parseInt(e.target.value))}
                  className="w-full h-2 bg-ginva-slate rounded-lg appearance-none cursor-pointer accent-ginva-gold mb-4"
                />
                <div className="text-3xl font-mono font-bold text-ginva-gold text-center">
                  {stakeAmount.toLocaleString()} USDC
                </div>
              </div>

              <div className="space-y-4 p-4 bg-ginva-slate/30 rounded-xl">
                <div className="flex justify-between">
                  <span className="text-ginva-silver">
                    รายได้ต่อปี (ประมาณ):
                  </span>
                  <span className="font-mono font-bold text-ginva-gold">
                    +{projectedYearly.toFixed(2)} USDC
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ginva-silver">
                    รายได้ต่อเดือน (ประมาณ):
                  </span>
                  <span className="font-mono font-bold text-ginva-cyan">
                    +{projectedMonthly.toFixed(2)} USDC
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ginva-silver">
                    รายได้ต่อวัน (ประมาณ):
                  </span>
                  <span className="font-mono">
                    +{(projectedMonthly / 30).toFixed(2)} USDC
                  </span>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <Button variant="primary" className="w-full">
                  เพิ่ม Stake
                </Button>
                <Button variant="outline" className="w-full">
                  ถอน Stake
                </Button>
              </div>
            </Card>

            {/* Current Stake Info */}
            <Card>
              <h2 className="text-xl font-semibold mb-6">
                ข้อมูล Stake ปัจจุบัน
              </h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between py-3 border-b border-ginva-slate/30">
                  <span className="text-ginva-silver">ยอด Stake ปัจจุบัน:</span>
                  <span className="font-mono font-bold">
                    {supporterData.totalStaked.toLocaleString()} USDC
                  </span>
                </div>
                <div className="flex justify-between py-3 border-b border-ginva-slate/30">
                  <span className="text-ginva-silver">รายได้สะสม:</span>
                  <span className="font-mono font-bold text-ginva-gold">
                    +{supporterData.earnedToDate} USDC
                  </span>
                </div>
                <div className="flex justify-between py-3 border-b border-ginva-slate/30">
                  <span className="text-ginva-silver">APY:</span>
                  <span className="font-mono text-ginva-cyan">
                    {supporterData.apy}%
                  </span>
                </div>
                <div className="flex justify-between py-3">
                  <span className="text-ginva-silver">ทบต้นอัตโนมัติ:</span>
                  <span className="text-ginva-cyan">
                    {supporterData.autoCompound ? "เปิดใช้งาน 🔄" : "ปิด"}
                  </span>
                </div>
              </div>

              <div className="bg-ginva-cyan/10 border border-ginva-cyan/30 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <span className="text-2xl">⚡</span>
                  <div>
                    <h3 className="font-semibold text-ginva-cyan mb-1">
                      ไม่มีการล็อก
                    </h3>
                    <p className="text-sm text-ginva-silver">
                      คุณสามารถถอนเงินได้ทุกเมื่อ
                      ไม่มีค่าธรรมเนียมการถอนก่อนกำหนด
                    </p>
                  </div>
                </div>
              </div>

              <Button variant="primary" className="w-full mt-6">
                รับรางวัล ({supporterData.earnedToDate} USDC)
              </Button>
            </Card>
          </div>
        )}

        {/* Info Banner */}
        <Card className="mt-8 bg-ginva-navy/30">
          <div className="flex items-start space-x-4">
            <span className="text-3xl">💡</span>
            <div>
              <h3 className="font-semibold mb-2">ทำไมต้องเป็นผู้สนับสนุน?</h3>
              <ul className="space-y-2 text-ginva-silver">
                <li>• ได้รับส่วนแบ่งรายได้สูงที่สุดในระบบ (65.25%)</li>
                <li>• ไม่มีการล็อก ถอนได้ทุกเมื่อ</li>
                <li>• รายได้ทบต้นอัตโนมัติ</li>
                <li>• ช่วยให้ระบบเติบโตอย่างยั่งยืน</li>
                <li>• ได้รับการปกป้องจากกองทุนสำรอง</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
