import type { Metadata } from "next";
import CalculatorClient from "./CalculatorClient";

export const metadata: Metadata = {
  title: "Lottery Calculator | LottoTally",
};

export default function CalculatorPage() {
  return <CalculatorClient />;
}
