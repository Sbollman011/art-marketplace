import ResetPasswordForm from './reset-password-form';

export default function ResetPasswordPage({ searchParams }) {
  return <ResetPasswordForm token={searchParams?.token || ''} />;
}