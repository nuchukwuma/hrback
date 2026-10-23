
export default async function sendEmail({ to, subject, html }) {
  console.log('EMAIL to:', to);
  console.log('Subject:', subject);
  console.log(html);
}
