export interface DeskSample {
  id: string;
  label: string;
  text: string;
}

export const DESK_SAMPLES: DeskSample[] = [
  {
    id: 'consulting',
    label: 'Freelance consulting agreement',
    text: `Independent Contractor Agreement

1. Engagement. Contractor shall provide design services to the Company on a project basis. Services shall be completed by the dates set in each Statement of Work. Time is of the essence.

2. Compensation. Company shall pay Contractor $90 per hour. Invoices shall be paid within 60 days of receipt. Late invoices shall accrue interest of 2% per month.

3. Intellectual Property. All work product, including drafts and proposals, shall be owned by the Company upon payment. Contractor shall retain a non-transferable licence to portfolio work unless it contains confidential information.

4. Confidentiality. Contractor shall not disclose Company trade secrets for one year after termination. No such clause limits disclosure required by law.

5. Liability. In no event shall Company's liability exceed the total fees paid in the preceding three months. Neither party shall be liable for indirect, incidental or consequential damages. Contractor shall indemnify Company against third-party claims arising from contractor's gross negligence.

6. Termination. Either party may terminate with 30 days written notice. Company may terminate immediately for contractor's failure to perform. Upon termination, Contractor shall be paid for work accepted before the notice.

7. Restrictive Covenant. Contractor shall not provide services to any client of the Company for a period of two years after termination.`,
  },
  {
    id: 'privacy',
    label: 'Consumer app privacy policy',
    text: `Privacy Policy — excerpt

Personal Data We Process. We process your name, email, device identifiers, precise location, browsing activity, and payment details when you use our services. Data is collected through cookies and device trackers when you visit any page of our website or open our mobile application.

How We Use Data. We use personal data to operate the service, personalise advertising, train our recommendation systems, and prevent fraud. We may combine data from third-party sources with the data you give us.

Sharing. We share personal data with advertising partners, analytics providers, and any successor in a merger or acquisition. Your data may be transferred to servers located outside your jurisdiction, including jurisdictions with different data protection standards.

Retention. Data is retained for as long as your account is active and for 24 months afterwards to support legal claims. Payment data is retained for 7 years as required by law.

Your Choices. You may request a copy of your data or ask us to delete it by emailing privacy@example.local. Deleting your account does not erase data already shared with advertising partners. Some jurisdictions recognise a do-not-track signal; our services do not respond to it.

Disputes. Any dispute arising under this policy shall be resolved by binding arbitration in the Company's Home County, and you waive the right to a jury trial and to participate in a class action. Opting out requires written notice within 30 days of first accepting the policy.`,
  },
  {
    id: 'lease',
    label: 'Residential lease',
    text: `Residential Lease Agreement — excerpt

Rent. Tenant shall pay rent of $1,800 per month due on the first of each month. Rent received after the fifth day of the month is late and incurs a $75 late fee plus $10 per day. A returned payment incurs a $40 fee.

Deposit. Tenant shall pay a security deposit of $2,700. Deposit shall be returned within 30 days of move-out less any deductions for damage beyond normal wear. The Landlord may deduct a flat $150 cleaning fee regardless of the condition of the premises.

Term and Renewal. This lease runs for 12 months. Unless Tenant gives written notice of termination at least 60 days before the end of the term, the lease renews automatically for another 12 months at a rent not less than 8% higher than the prior term.

Use of Premises. Tenant shall not sublet or assign the premises. No pets are permitted. Tenant shall permit Landlord access for repairs with 24 hours notice, and agrees the Landlord may enter without notice in emergencies.

Maintenance and Repair. Tenant shall maintain the premises and shall be responsible for repairs costing up to $150 each, including plumbing stoppages. Landlord shall maintain structural systems and appliances, but is released from liability for repairs unreasonably delayed by exercise of Tenant's rights under this agreement.

Noise. Tenant shall not create noise audible outside the unit between 9:00 pm and 8:00 am. Repeat violations are grounds for termination with 7 days notice even where the lease has not otherwise expired.`,
  },
];