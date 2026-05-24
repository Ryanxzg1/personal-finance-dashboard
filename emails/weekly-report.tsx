import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Row,
  Column,
  Hr,
  Tailwind,
} from "@react-email/components";
import * as React from "react";

interface WeeklyReportEmailProps {
  userName: string;
  startDate: string;
  endDate: string;
  totalIncome: number;
  totalExpense: number;
  topCategory: string;
  topCategoryAmount: number;
}

export const WeeklyReportEmail = ({
  userName = "Pengguna",
  startDate,
  endDate,
  totalIncome,
  totalExpense,
  topCategory,
  topCategoryAmount,
}: WeeklyReportEmailProps) => {
  const balance = totalIncome - totalExpense;
  const isPositive = balance >= 0;

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  return (
    <Html>
      <Head />
      <Preview>Laporan Mingguan Buku Kas Anda ({startDate} - {endDate})</Preview>
      <Tailwind>
        <Body className="bg-gray-50 my-auto mx-auto font-sans">
          <Container className="bg-white border border-gray-200 rounded my-[40px] mx-auto p-[20px] max-w-[600px]">
            <Section className="mt-[32px]">
              <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
                Laporan Keuangan Mingguan
              </Heading>
              <Text className="text-gray-500 text-[14px] leading-[24px] text-center mb-[30px]">
                {startDate} - {endDate}
              </Text>
            </Section>

            <Section>
              <Text className="text-black text-[14px] leading-[24px]">
                Halo {userName},
              </Text>
              <Text className="text-black text-[14px] leading-[24px]">
                Berikut adalah ringkasan aktivitas keuangan Anda selama satu minggu terakhir.
              </Text>
            </Section>

            <Section className="bg-gray-50 rounded-lg p-6 my-6">
              <Row>
                <Column>
                  <Text className="text-gray-500 text-[12px] uppercase tracking-wider mb-1">
                    Total Pemasukan
                  </Text>
                  <Text className="text-green-600 text-[18px] font-bold m-0">
                    {formatIDR(totalIncome)}
                  </Text>
                </Column>
                <Column>
                  <Text className="text-gray-500 text-[12px] uppercase tracking-wider mb-1">
                    Total Pengeluaran
                  </Text>
                  <Text className="text-red-600 text-[18px] font-bold m-0">
                    {formatIDR(totalExpense)}
                  </Text>
                </Column>
              </Row>
              <Hr className="border-gray-200 my-4" />
              <Row>
                <Column>
                  <Text className="text-gray-500 text-[12px] uppercase tracking-wider mb-1">
                    Net Cash Flow
                  </Text>
                  <Text
                    className={`text-[20px] font-bold m-0 ${
                      isPositive ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {isPositive ? "+" : ""}
                    {formatIDR(balance)}
                  </Text>
                </Column>
              </Row>
            </Section>

            {topCategory && totalExpense > 0 && (
              <Section className="mb-6">
                <Heading className="text-black text-[16px] font-bold mb-4">
                  Pengeluaran Terbesar
                </Heading>
                <Text className="text-gray-600 text-[14px] leading-[24px]">
                  Porsi terbesar pengeluaran Anda minggu ini dialokasikan untuk{" "}
                  <strong>{topCategory}</strong> sebesar{" "}
                  <strong>{formatIDR(topCategoryAmount)}</strong>.
                </Text>
              </Section>
            )}

            <Section>
              <Text className="text-gray-500 text-[12px] leading-[24px] text-center mt-[30px]">
                Terlampir adalah dokumen PDF berisi detail transaksi Anda secara lengkap.
              </Text>
            </Section>

            <Hr className="border-gray-200 border border-solid mt-[48px] mb-[24px] mx-0 w-full" />
            
            <Text className="text-[#666666] text-[12px] leading-[24px] text-center">
              Buku Kas Dashboard • Mengatur keuangan jadi lebih mudah.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default WeeklyReportEmail;
