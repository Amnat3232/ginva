import React, { useState } from "react";
import Layout from "../components/Layout";
import Button from "../components/Button";
import Card from "../components/Card";

interface CollateralOption {
  symbol: string;
  price: number;
  icon: string;
}

const collateralOptions: CollateralOption[] = [
  { symbol: "SOL", price: 142.5, icon: "◎" },
  { symbol: "BTC", price: 67240.0, icon: "₿" },
  { symbol: "ETH", price: 3890.0, icon: "Ξ" },
];

export default function BorrowPage() {
  const [step, setStep] = useState(1);
  const [selectedCollateral, setSelectedCollateral] =
    useState<CollateralOption>(collateralOptions[0]);
  const [amount, setAmount] = useState(5.5);

  // Calculations
  const collateralValue = amount * selectedCollateral.price;
  const ltv = 42; // 42% LTV
  const borrowAmount = collateralValue * (ltv / 100);
  const interestRate = 12; // 12% APR
  const monthlyInterest = (borrowAmount * (interestRate / 100)) / 12;
  const liquidationPrice = selectedCollateral.price * 0.67; // ~67% of current price

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  // Progress Bar Component
  const ProgressBar = () => (
    <div className="mb-8">
      <div className="flex justify-between text-sm text-ginva-silver mb-2">
        <span>ขั้นตอนที่ {step} จาก 4</span>
        <span>{Math.round((step / 4) * 100)}%</span>
      </div>
      <div className="w-full bg-ginva-slate rounded-full h-2">
        <div
          className="bg-ginva-gold h-2 rounded-full transition-all duration-300"
          style={{ width: `${(step / 4) * 100}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-ginva-silver mt-2">
        <span className={step >= 1 ? "text-ginva-gold" : ""}>
          เลือกหลักประกัน
        </span>
        <span className={step >= 2 ? "text-ginva-gold" : ""}>
          ยืนยันเงื่อนไข
        </span>
        <span className={step >= 3 ? "text-ginva-gold" : ""}>เชื่อมต่อ</span>
        <span className={step >= 4 ? "text-ginva-gold" : ""}>เสร็จสิ้น</span>
      </div>
    </div>
  );

  // Step 1: Select Collateral
  const Step1 = () => (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-display font-bold mb-2">เลือกหลักประกัน</h2>
      <p className="text-ginva-silver mb-6">
        เลือกสินทรัพย์ที่ต้องการฝากเป็นหลักประกัน
      </p>

      {/* Collateral Selection */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {collateralOptions.map((option) => (
          <button
            key={option.symbol}
            onClick={() => setSelectedCollateral(option)}
            className={`p-4 rounded-xl border-2 transition-all duration-200 ${
              selectedCollateral.symbol === option.symbol
                ? "border-ginva-gold bg-ginva-gold/10"
                : "border-ginva-slate hover:border-ginva-silver"
            }`}
          >
            <div className="text-3xl mb-2">{option.icon}</div>
            <div className="font-semibold">{option.symbol}</div>
            <div className="text-sm text-ginva-silver">
              ${option.price.toLocaleString()}
            </div>
            {selectedCollateral.symbol === option.symbol && (
              <div className="mt-2 text-ginva-gold">☑️</div>
            )}
          </button>
        ))}
      </div>

      {/* Amount Input */}
      <div className="mb-8">
        <label className="block text-sm font-medium mb-2">
          จำนวน {selectedCollateral.symbol} ที่จะฝาก
        </label>
        <div className="relative">
          <input
            type="range"
            min="0.1"
            max="100"
            step="0.1"
            value={amount}
            onChange={(e) => setAmount(parseFloat(e.target.value))}
            className="w-full h-2 bg-ginva-slate rounded-lg appearance-none cursor-pointer accent-ginva-gold"
          />
          <div className="flex justify-between mt-2">
            <button
              onClick={() => setAmount(Math.max(0.1, amount - 0.5))}
              className="w-10 h-10 rounded-full bg-ginva-slate hover:bg-ginva-silver/20 flex items-center justify-center text-xl"
            >
              -
            </button>
            <div className="text-2xl font-mono font-bold text-ginva-gold">
              {amount} {selectedCollateral.symbol}
            </div>
            <button
              onClick={() => setAmount(Math.min(100, amount + 0.5))}
              className="w-10 h-10 rounded-full bg-ginva-slate hover:bg-ginva-silver/20 flex items-center justify-center text-xl"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Summary */}
      <Card className="bg-ginva-navy/50 border-ginva-gold/30">
        <div className="flex items-start space-x-3 mb-4">
          <span className="text-2xl">💡</span>
          <div>
            <h3 className="font-semibold text-ginva-gold">สรุป</h3>
          </div>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-ginva-silver">คุณจะได้รับ:</span>
            <span className="font-mono font-bold text-ginva-gold">
              {borrowAmount.toFixed(0)} USDC
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-ginva-silver">LTV:</span>
            <span className="font-mono text-ginva-cyan">
              {ltv}% (Safe Zone 🟢)
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-ginva-silver">ดอกเบี้ย:</span>
            <span className="font-mono">
              {interestRate}% APR ({monthlyInterest.toFixed(1)} USDC/เดือน)
            </span>
          </div>
          <div className="pt-2 border-t border-ginva-slate">
            <div className="flex items-center space-x-2">
              <span className="text-ginva-cyan">🛡️</span>
              <span className="text-ginva-cyan">
                ระบบปกป้อง 72 ชั่วโมง: เปิดใช้งาน
              </span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );

  // Step 2: Review Protection
  const Step2 = () => (
    <div className="animate-fade-in">
      <button
        onClick={handleBack}
        className="text-ginva-silver hover:text-ginva-gold mb-4 flex items-center"
      >
        ← กลับ
      </button>

      <h2 className="text-2xl font-display font-bold mb-2">
        ตรวจสอบการปกป้องของคุณ
      </h2>

      {/* Protection Info */}
      <Card className="mb-6 bg-gradient-to-r from-ginva-cyan/10 to-ginva-navy border-ginva-cyan/30">
        <div className="flex items-start space-x-3 mb-4">
          <span className="text-3xl">🛡️</span>
          <div>
            <h3 className="font-semibold text-ginva-cyan text-lg">
              ระบบปกป้อง 72 ชั่วโมง
            </h3>
          </div>
        </div>

        <div className="space-y-3 text-ginva-silver">
          <p>
            ถ้าราคา {selectedCollateral.symbol} ต่ำกว่า{" "}
            <span className="text-ginva-gold font-mono">
              ${liquidationPrice.toFixed(2)}
            </span>
            :
          </p>

          <div className="pl-4 space-y-2">
            <div className="flex items-start space-x-2">
              <span className="text-ginva-cyan">•</span>
              <span>ชั่วโมงที่ 0-72: คุณสามารถเพิ่มหลักประกันได้</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-ginva-cyan">•</span>
              <span>คุณสามารถคืนเงินบางส่วนได้</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-ginva-cyan">•</span>
              <span>หรือรอดูสถานการณ์ต่อไป</span>
            </div>
          </div>

          <div className="pt-2 border-t border-ginva-slate/50">
            <p className="text-sm">
              หลังชั่วโมงที่ 72: ระบบจะเริ่มกระบวนการช่วยเหลือ
            </p>
          </div>
        </div>

        <button className="mt-4 text-ginva-cyan hover:underline text-sm">
          ดู Timeline Visualization →
        </button>
      </Card>

      {/* Loan Details */}
      <Card>
        <h3 className="font-semibold mb-4 flex items-center">
          <span className="mr-2">📊</span> รายละเอียดเงินกู้
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b border-ginva-slate/30">
            <span className="text-ginva-silver">หลักประกัน:</span>
            <span className="font-mono">
              {amount} {selectedCollateral.symbol} ($
              {collateralValue.toFixed(2)})
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-ginva-slate/30">
            <span className="text-ginva-silver">ได้รับ:</span>
            <span className="font-mono font-bold text-ginva-gold">
              {borrowAmount.toFixed(0)} USDC
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-ginva-slate/30">
            <span className="text-ginva-silver">ดอกเบี้ย:</span>
            <span className="font-mono">
              {monthlyInterest.toFixed(1)} USDC/เดือน
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-ginva-slate/30">
            <span className="text-ginva-silver">ราคาช่วยเหลือ:</span>
            <span className="font-mono text-ginva-amber">
              ${liquidationPrice.toFixed(2)}/{selectedCollateral.symbol}
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-ginva-silver">LTV สูงสุด:</span>
            <span className="font-mono">60%</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-ginva-slate/30 text-center">
          <p className="text-sm text-ginva-cyan">
            ค่าธรรมเนียมทั้งหมด: 0 USDC (ไม่มีค่าธรรมเนียมแอบแฝง)
          </p>
        </div>
      </Card>

      <div className="flex justify-between mt-8">
        <Button variant="outline" onClick={handleBack}>
          ← กลับไปแก้ไข
        </Button>
        <Button variant="primary" onClick={handleNext}>
          ยืนยันและกู้เงิน
        </Button>
      </div>
    </div>
  );

  // Step 3: Connect Wallet
  const Step3 = () => (
    <div className="animate-fade-in">
      <button
        onClick={handleBack}
        className="text-ginva-silver hover:text-ginva-gold mb-4 flex items-center"
      >
        ← กลับ
      </button>

      <h2 className="text-2xl font-display font-bold mb-2">
        เชื่อมต่อกระเป๋าเงิน
      </h2>
      <p className="text-ginva-silver mb-8">เลือกกระเป๋าที่ต้องการใช้งาน</p>

      {/* Wallet Options */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {[
          { name: "Phantom", icon: "👻" },
          { name: "Solflare", icon: "🎒" },
          { name: "Backpack", icon: "🎒" },
          { name: "อื่นๆ...", icon: "➕" },
        ].map((wallet) => (
          <button
            key={wallet.name}
            onClick={handleNext}
            className="p-6 rounded-xl border-2 border-ginva-slate hover:border-ginva-gold hover:bg-ginva-gold/5 transition-all duration-200 flex flex-col items-center"
          >
            <span className="text-4xl mb-3">{wallet.icon}</span>
            <span className="font-semibold">{wallet.name}</span>
          </button>
        ))}
      </div>

      {/* Security Info */}
      <Card className="bg-ginva-navy/50">
        <div className="flex items-start space-x-3">
          <span className="text-2xl">🔒</span>
          <div>
            <h3 className="font-semibold mb-2">ความปลอดภัย</h3>
            <ul className="space-y-2 text-sm text-ginva-silver">
              <li>• GINVA ไม่สามารถเข้าถึง private keys ของคุณได้</li>
              <li>• ทุกธุรกรรมต้องได้รับการอนุมัติจากคุณเท่านั้น</li>
              <li>• ข้อมูลถูกเข้ารหัสตลอดการเชื่อมต่อ</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );

  // Step 4: Success
  const Step4 = () => (
    <div className="animate-fade-in text-center py-8">
      <div className="text-6xl mb-6">✅</div>
      <h2 className="text-3xl font-display font-bold mb-4">สำเร็จ!</h2>
      <p className="text-xl text-ginva-silver mb-2">
        <span className="text-ginva-gold font-bold">
          {borrowAmount.toFixed(0)} USDC
        </span>{" "}
        ถูกส่งไปยังกระเป๋าของคุณ
      </p>
      <p className="text-ginva-silver mb-8">
        สินทรัพย์ของคุณปลอดภัยด้วยระบบปกป้อง 72 ชั่วโมง
      </p>

      {/* Transaction Details */}
      <Card className="max-w-md mx-auto mb-8 text-left">
        <h3 className="font-semibold mb-4">รายละเอียดธุรกรรม</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-ginva-silver">Transaction ID:</span>
            <span className="font-mono text-ginva-gold">0x7a2f...8e4d</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ginva-silver">เวลา:</span>
            <span>14:32 น. 15 มีนาคม 2024</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ginva-silver">หลักประกัน:</span>
            <span>
              {amount} {selectedCollateral.symbol}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-ginva-silver">ได้รับ:</span>
            <span className="font-mono text-ginva-gold">
              {borrowAmount.toFixed(0)} USDC
            </span>
          </div>
        </div>
      </Card>

      <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
        <Button variant="primary">ไปที่ Dashboard</Button>
        <Button variant="outline">แชร์บน X</Button>
      </div>

      {/* Next Steps */}
      <Card className="max-w-md mx-auto text-left">
        <h3 className="font-semibold mb-3">ขั้นตอนต่อไป:</h3>
        <ul className="space-y-2 text-sm text-ginva-silver">
          <li>• ติดตามสุขภาพบัญชีผ่าน Dashboard</li>
          <li>• รับการแจ้งเตือนหากต้องการดำเนินการ</li>
          <li>• จ่ายดอกเบี้ี้ยทุก 30 วัน</li>
        </ul>
      </Card>
    </div>
  );

  return (
    <Layout title="กู้เงิน - GINVA">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <ProgressBar />

        {step === 1 && <Step1 />}
        {step === 2 && <Step2 />}
        {step === 3 && <Step3 />}
        {step === 4 && <Step4 />}

        {step < 4 && step !== 2 && (
          <div className="mt-8 flex justify-between">
            {step > 1 && (
              <Button variant="outline" onClick={handleBack}>
                ← กลับ
              </Button>
            )}
            {step === 1 && <div />} {/* Spacer */}
            {step !== 2 && (
              <Button variant="primary" onClick={handleNext}>
                ดำเนินการต่อ →
              </Button>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
