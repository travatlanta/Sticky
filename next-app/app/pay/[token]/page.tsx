import PaymentClient from "./PaymentClient";

export default function PaymentPage({ params }: { params: { token: string } }) {
  return <PaymentClient token={params.token} />;
}
