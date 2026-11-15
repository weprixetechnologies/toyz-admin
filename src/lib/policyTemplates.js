/**
 * Professional Legal Policy Templates with dynamic variable interpolation
 */

export const DEFAULT_STORE_VARIABLES = {
  company_name: 'Provoke Playtech Private Limited',
  store_name: 'Provoke Playtech',
  website_url: 'https://provokeplaytech.com',
  support_email: 'support@provokeplaytech.com',
  support_phone: '+91 98765 43210',
  address: '123 Playtime Avenue, Tech Hub, Mumbai, MH, 400001, India',
  return_days: '7',
  refund_days: '5 to 7'
};

export function interpolatePolicyVariables(text, variables = DEFAULT_STORE_VARIABLES) {
  if (!text) return '';
  let result = text;
  for (const [key, val] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'gi');
    result = result.replace(regex, val);
  }
  return result;
}

export const POLICY_TEMPLATES = [
  {
    id: 'privacy',
    title: 'Privacy Policy',
    type: 'privacy',
    defaultSlug: 'privacy-policy',
    metaTitle: 'Privacy Policy | {{store_name}}',
    metaDescription: 'Learn how {{store_name}} collects, safeguards, and handles your personal data, payments, and cookies.',
    summary: 'Comprehensive information on data protection, PCI-DSS payment compliance, customer rights, and cookie tracking.',
    content: `<h2>1. Introduction & Overview</h2>
<p>Welcome to <strong>{{store_name}}</strong> ("we", "our", or "us"). We operate under <strong>{{company_name}}</strong> and respect your privacy. This Privacy Policy details the types of personal data we collect from you, how we use, process, and safeguard it, and your rights concerning your personal information when you visit <strong>{{website_url}}</strong>.</p>

<h2>2. Information We Collect</h2>
<p>We may collect personal information about you from a variety of sources:</p>
<ul>
  <li><strong>Contact & Identity Information:</strong> Full name, billing and shipping address, email address, mobile phone number.</li>
  <li><strong>Payment & Billing Data:</strong> Payment card details and UPI identifiers processed directly through PCI-DSS Level 1 certified payment gateways (e.g. PhonePe). We do not store sensitive credit card numbers or CVVs on our servers.</li>
  <li><strong>Account Credentials:</strong> Username, secure password hashes, and account activity history.</li>
  <li><strong>Technical & Browsing Data:</strong> IP addresses, browser types, operating systems, session timestamps, and device identifiers collected automatically via cookies.</li>
</ul>

<h2>3. Purpose of Processing Your Information</h2>
<p>We utilize your data strictly for legitimate operational and business purposes:</p>
<ul>
  <li>To confirm, process, pack, and ship your orders to your designated address.</li>
  <li>To send real-time order tracking notifications and customer support responses.</li>
  <li>To detect, prevent, and mitigate fraud, spam, or unauthorized access.</li>
  <li>To keep you updated on special deals, new launches, and seasonal discounts (which you can opt out of anytime).</li>
  <li>To comply with statutory tax, invoicing (GST), and regulatory requirements.</li>
</ul>

<h2>4. Third-Party Sharing & Service Partners</h2>
<p>We never sell your personal information. We disclose necessary data only to authorized service providers bound by strict confidentiality:</p>
<ul>
  <li><strong>Logistics Partners:</strong> Courier companies solely to deliver your orders.</li>
  <li><strong>Payment Gateways:</strong> To authorize and process secure electronic transactions.</li>
  <li><strong>Legal Authorities:</strong> Where compelled by law, court summons, or governmental investigative requests.</li>
</ul>

<h2>5. Data Retention & Security Measures</h2>
<p>We implement end-to-end HTTPS/TLS encryption and stringent physical and cloud security access controls to keep your data safe. We retain your personal data only as long as necessary to fulfill orders and adhere to legal tax retention periods.</p>

<h2>6. Your Privacy Rights</h2>
<p>Under applicable data protection laws, you have the right to request access to the personal data we hold about you, request rectification of inaccurate records, or request account deletion. To submit a request, contact our privacy desk.</p>

<h2>7. Grievance Officer & Contact Us</h2>
<p>If you have questions or grievances regarding this Privacy Policy, please contact our designated Grievance Officer:</p>
<div class="callout callout-info" style="background-color: #f0f9ff; border-left: 4px solid #0284c7; padding: 14px 18px; margin: 16px 0; border-radius: 6px;">
  <p style="margin: 0;"><strong>{{company_name}}</strong><br/>
  <strong>Email:</strong> {{support_email}}<br/>
  <strong>Phone:</strong> {{support_phone}}<br/>
  <strong>Physical Address:</strong> {{address}}</p>
</div>`
  },
  {
    id: 'refund',
    title: 'Cancellation & Refund Policy',
    type: 'refund',
    defaultSlug: 'refund-policy',
    metaTitle: 'Refund & Return Policy | {{store_name}}',
    metaDescription: 'Read our transparent {{return_days}}-day return, exchange, and cancellation policy at {{store_name}}.',
    summary: 'Clear guidelines regarding {{return_days}}-day returns, cancellation cutoff, and refund timelines ({{refund_days}} business days).',
    content: `<h2>1. Easy {{return_days}}-Day Return & Exchange Window</h2>
<p>At <strong>{{store_name}}</strong>, we want you to be completely satisfied with every purchase. If you receive an item that is defective, damaged during transit, or substantially different from its online description, you may initiate a return or replacement within <strong>{{return_days}} days</strong> of delivery.</p>

<h2>2. Conditions for Returning Merchandise</h2>
<p>To ensure a swift return or replacement, the product must fulfill the following criteria:</p>
<ul>
  <li>Must be in its original, uninstalled, and unused condition with all accessories included.</li>
  <li>Must retain all original manufacturer packaging, barcodes, tags, manuals, and warranty documents.</li>
  <li>Must include the original invoice or proof of purchase.</li>
  <li>Must not show any signs of physical abuse, water ingress, or customer-induced damage.</li>
</ul>

<h2>3. Order Cancellation Policy</h2>
<p>You can cancel your order anytime before the shipment has been packed and dispatched from our warehouse facility. Once dispatched and assigned an Air Waybill (AWB) number, orders cannot be canceled in transit; you may refuse delivery or request a return upon arrival.</p>

<h2>4. Return Pickup Process</h2>
<ol>
  <li>Go to <strong>My Orders</strong> on {{website_url}} or email {{support_email}} with your Order ID and photos/video of the issue.</li>
  <li>Our support team will verify your claim within 24 to 48 hours.</li>
  <li>Upon approval, our courier partner will arrive for a doorstep pickup at no cost to you.</li>
</ol>

<h2>5. Refund Timelines & Method</h2>
<p>Once your returned item arrives at our inspection facility and passes quality check:</p>
<ul>
  <li><strong>Prepaid Orders (Cards, Net Banking, UPI):</strong> Refunds will be credited to the original payment method within <strong>{{refund_days}} business days</strong>.</li>
  <li><strong>Cash on Delivery (COD) Orders:</strong> Refunds will be transferred via NEFT/IMPS bank transfer or instant store wallet credit.</li>
</ul>

<h2>6. Return & Refund Queries</h2>
<div class="callout callout-info" style="background-color: #f0f9ff; border-left: 4px solid #0284c7; padding: 14px 18px; margin: 16px 0; border-radius: 6px;">
  <p style="margin: 0;"><strong>Customer Support Desk:</strong> {{support_email}}<br/>
  <strong>Helpline:</strong> {{support_phone}} (Mon–Sat, 10:00 AM – 7:00 PM IST)</p>
</div>`
  },
  {
    id: 'terms',
    title: 'Terms & Conditions',
    type: 'terms',
    defaultSlug: 'terms-and-conditions',
    metaTitle: 'Terms and Conditions | {{store_name}}',
    metaDescription: 'Read the official terms and conditions governing the use of {{store_name}} online storefront and services.',
    summary: 'Binding legal terms regarding website usage, product descriptions, pricing accuracy, user responsibilities, and limitation of liability.',
    content: `<h2>1. Agreement to Terms</h2>
<p>These Terms of Service constitute a legally binding agreement between you and <strong>{{company_name}}</strong> ("Company", "we", "our"). By accessing {{website_url}}, browsing our product listings, or placing an order, you agree to comply with and be bound by these Terms.</p>

<h2>2. Eligibility & User Accounts</h2>
<p>You must be at least 18 years old or under adult supervision to purchase from {{store_name}}. You are responsible for keeping your account credentials secure and for all actions taken under your account.</p>

<h2>3. Products, Pricing & Inventory</h2>
<ul>
  <li>All prices are inclusive of applicable taxes unless explicitly noted.</li>
  <li>Prices and item availability are subject to change without prior notice.</li>
  <li>We make every effort to display product colors and features accurately; however, display monitor variations may affect actual product appearance.</li>
  <li>In the unlikely event of an erroneous pricing glitch, we reserve the right to cancel orders placed for such items and issue an immediate 100% refund.</li>
</ul>

<h2>4. Intellectual Property</h2>
<p>All trademarks, logos, texts, photographs, graphical assets, and digital media displayed on {{website_url}} are the exclusive property of {{company_name}} and protected under copyright laws. Any unauthorized reproduction is strictly prohibited.</p>

<h2>5. Limitation of Liability</h2>
<p>To the fullest extent permitted by applicable law, {{company_name}} shall not be liable for any indirect, punitive, or consequential damages resulting from the use of our services or items purchased.</p>

<h2>6. Governing Law & Jurisdiction</h2>
<p>These Terms shall be governed by the laws of India. Any legal dispute or proceeding arising under these Terms shall be subject to the exclusive jurisdiction of the competent courts in Mumbai, India.</p>`
  },
  {
    id: 'shipping',
    title: 'Shipping & Delivery Policy',
    type: 'shipping',
    defaultSlug: 'shipping-policy',
    metaTitle: 'Shipping & Delivery Policy | {{store_name}}',
    metaDescription: 'Shipping rates, dispatch schedules, transit durations, and delivery guidelines at {{store_name}}.',
    summary: 'Information about warehouse dispatch timelines (24-48 hours), courier partners, and estimated transit times across India.',
    content: `<h2>1. Order Processing Time</h2>
<p>All confirmed orders are processed, packaged, and dispatched from our fulfillment center within <strong>24 to 48 business hours</strong> (excluding national holidays and Sundays).</p>

<h2>2. Shipping Partners & Coverage</h2>
<p>We partner with top-tier courier networks including Bluedart, Delhivery, DTDC, and Shiprocket to deliver orders safely across more than 26,000 pincodes throughout India.</p>

<h2>3. Estimated Delivery Times</h2>
<ul>
  <li><strong>Metro Cities (Delhi, Mumbai, Bengaluru, Chennai, Hyderabad, Kolkata):</strong> 2 to 4 Business Days</li>
  <li><strong>Tier 2 & Tier 3 Cities:</strong> 3 to 6 Business Days</li>
  <li><strong>Remote & Special Territories (J&K, Northeast, Islands):</strong> 5 to 9 Business Days</li>
</ul>

<h2>4. Order Tracking</h2>
<p>Once your parcel has been handed over to our courier partner, you will receive an SMS and email with your Air Waybill (AWB) tracking number and a link to view live parcel updates.</p>

<h2>5. Parcel Damage or Tampering on Delivery</h2>
<p>If you notice external damage or tampering with the parcel at delivery, please reject the shipment and contact our support team at <strong>{{support_email}}</strong> with photos within 24 hours.</p>`
  },
  {
    id: 'cookie',
    title: 'Cookie Policy',
    type: 'cookie',
    defaultSlug: 'cookie-policy',
    metaTitle: 'Cookie Policy | {{store_name}}',
    metaDescription: 'Learn how {{store_name}} uses cookies and local storage to personalize your browsing and shopping experience.',
    summary: 'Overview of essential, performance, and advertising cookies and how users can control their cookie settings.',
    content: `<h2>1. What Are Cookies?</h2>
<p>Cookies are small text files placed on your browser or mobile device when you browse websites. They help remember your preferences, keep items in your shopping cart, and improve overall performance.</p>

<h2>2. Types of Cookies We Use</h2>
<ul>
  <li><strong>Essential Cookies:</strong> Necessary for core site functionality like secure login, shopping cart persistence, and checkout.</li>
  <li><strong>Analytics & Performance Cookies:</strong> Help us understand which pages are most visited and pinpoint any site errors.</li>
  <li><strong>Preference Cookies:</strong> Remember your selected currency, language, and display preferences.</li>
</ul>

<h2>3. How to Manage Cookies</h2>
<p>You can manage or disable cookies at any time via your browser settings. Please note that disabling essential cookies may impact your ability to place orders smoothly on {{store_name}}.</p>`
  }
];
