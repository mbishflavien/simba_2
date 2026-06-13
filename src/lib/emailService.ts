import { collection, doc, setDoc, Timestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { Order, PurchaseOrder, Supplier, Promotion } from '../types';
import { formatCurrency } from './utils';

export interface EmailLog {
  id: string;
  to: string;
  recipientName: string;
  subject: string;
  body: string;
  type: 'order_confirmation' | 'order_shipped' | 'order_delivered' | 'supplier_demand' | 'promotion_broadcast' | 'supplier_shipment' | 'supplier_goods_received';
  status: 'sent' | 'pending' | 'failed';
  createdAt: any;
  metadata?: {
    orderId?: string;
    supplierId?: string;
    promotionId?: string;
    productId?: string;
    customMessage?: string;
    [key: string]: any;
  };
}

// 1. General email HTML template wrapper
export function buildEmailHtml(title: string, bodyContent: string, ctaText?: string, ctaUrl?: string): string {
  const ctaButtonHtml = ctaText && ctaUrl ? `
    <div style="text-align: center; margin: 32px 0;">
      <a href="${ctaUrl}" target="_blank" style="background-color: #E2231A; color: #FFFFFF; font-family: 'Space Grotesk', 'Inter', Arial, sans-serif; font-weight: 800; text-transform: uppercase; font-size: 11px; letter-spacing: 2px; text-decoration: none; padding: 14px 28px; border-radius: 12px; display: inline-block; box-shadow: 0 4px 12px rgba(226, 35, 26, 0.25); text-align: center; font-style: italic;">
        ${ctaText}
      </a>
    </div>
  ` : '';

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #0E0F12; color: #E4E4E7; font-family: 'Inter', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0E0F12; padding: 40px 20px;">
        <tr>
          <td align="center">
            <!-- Email Body Contained Box -->
            <table width="100%" max-width="600" style="max-width: 600px; width: 100%; bg-color: #16171D; background-color: #16171D; border: 1px solid #27272A; border-radius: 32px; overflow: hidden; border-collapse: separate;" cellspacing="0" cellpadding="0">
              <!-- Header Section -->
              <tr style="background: linear-gradient(135deg, #1A1C24 0%, #0E0F12 100%); border-bottom: 1px solid #27272A;">
                <td style="padding: 32px 40px; text-align: center;">
                  <table width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                      <td align="center" style="font-family: 'Space Grotesk', 'Inter', sans-serif; font-size: 24px; font-weight: 900; letter-spacing: -1px; text-transform: uppercase; font-style: italic; color: #FFFFFF; text-align: center;">
                        <span style="color: #E2231A;">SIMBA</span> <span style="font-weight: 300; opacity: 0.8;">SUPERMARKET</span>
                      </td>
                    </tr>
                    <tr>
                      <td align="center" style="font-size: 9px; text-transform: uppercase; letter-spacing: 3px; color: #A1A1AA; font-weight: 700; padding-top: 6px;">
                        Kigali's Premium Grocer • Rwanda
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Core Content Section -->
              <tr>
                <td style="padding: 40px 40px 24px 40px;">
                  <h1 style="font-family: 'Space Grotesk', 'Inter', Arial, sans-serif; font-size: 20px; font-weight: 900; letter-spacing: -0.5px; text-transform: uppercase; font-style: italic; color: #FFFFFF; margin-top: 0; margin-bottom: 20px;">
                    ${title}
                  </h1>
                  
                  <div style="font-size: 13px; line-height: 1.6; color: #D4D4D8;">
                    ${bodyContent}
                  </div>

                  ${ctaButtonHtml}
                </td>
              </tr>
              
              <!-- Footer Section -->
              <tr style="background-color: #111217; border-top: 1px solid #27272A;">
                <td style="padding: 24px 40px; text-align: center; border-radius: 0 0 32px 32px;">
                  <p style="font-size: 10px; color: #71717A; line-height: 1.5; margin: 0; font-weight: 500;">
                    You are receiving this official copy because you are an authorized partner, stakeholder, or customer of Kigali Simba Supermarket.
                  </p>
                  <p style="font-family: monospace; font-size: 9px; color: #52525B; margin-top: 12px; margin-bottom: 0; text-transform: uppercase; letter-spacing: 1px;">
                    SIMBA HEADQUARTERS • KN 4 AVE • KIGALI, RWANDA • +250 788 000 001
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

// 2. Main save email dispatcher
export async function sendEmail(log: Omit<EmailLog, 'id' | 'createdAt'>): Promise<string> {
  const emailId = `EML-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`.toUpperCase();
  try {
    const emailRef = doc(db, 'emails', emailId);
    await setDoc(emailRef, {
      ...log,
      id: emailId,
      createdAt: Timestamp.now()
    });
    console.log(`[Email Transmitted] Target: ${log.to} | Subject: ${log.subject} | ID: ${emailId}`);
    return emailId;
  } catch (error) {
    console.error(`Failed to record email to ${log.to} in firestore:`, error);
    handleFirestoreError(error, OperationType.CREATE, `emails/${emailId}`);
    return '';
  }
}

// 3. User Order Confirmation
export async function sendOrderConfirmation(order: Order, userEmail: string, userName: string): Promise<string> {
  const totalItemsCount = order.items.reduce((acc, current) => acc + current.quantity, 0);
  const itemsRows = order.items.map(item => `
    <tr style="border-bottom: 1px solid #27272A;">
      <td style="padding: 12px 0; font-size: 12px; color: #FFFFFF; font-weight: 700;">
        ${item.name} <span style="opacity: 0.5; font-size: 10px; font-weight: 400; font-family: monospace; margin-left: 6px;">x${item.quantity}</span>
      </td>
      <td style="padding: 12px 0; font-size: 12px; color: #D4D4D8; text-align: right; font-family: monospace;">
        ${formatCurrency(item.price * item.quantity)}
      </td>
    </tr>
  `).join('');

  const estimatedDeliveryTime = "Today, within 1-2 hours";
  
  const content = `
    <p style="margin-top: 0;">Mwaramutse <strong>${userName}</strong>,</p>
    <p>Thank you for shopping at Simba Supermarket! Your order <strong>#${order.orderId}</strong> has been received and is currently being packed with the freshest premium goods at our branch.</p>
    
    <!-- Order Box Card -->
    <div style="background-color: #1C1D24; border: 1px solid #27272A; border-radius: 16px; padding: 20px; margin: 24px 0;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0">
        <tr>
          <td style="font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; color: #71717A; font-weight: 700; padding-bottom: 12px;">Order Receipts • # ${order.orderId}</td>
        </tr>
      </table>
      <table width="100%" border="0" cellspacing="0" cellpadding="0">
        ${itemsRows}
        <tr style="border-top: 1px solid #3F3F46;">
          <td style="padding: 16px 0 6px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #A1A1AA; font-weight: 700;">Total Paid Amount</td>
          <td style="padding: 16px 0 6px 0; font-size: 16px; font-weight: 900; font-style: italic; color: #E2231A; text-align: right; font-family: monospace;">
            ${formatCurrency(order.total)}
          </td>
        </tr>
      </table>
    </div>

    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 20px; border-top: 1px solid #27272A; padding-top: 20px;">
      <tr>
        <td style="vertical-align: top; width: 50%; padding-right: 15px;">
          <h4 style="font-family: 'Space Grotesk', sans-serif; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #FFFFFF; margin: 0 0 8px 0; font-style: italic;">Delivery Details</h4>
          <p style="font-size: 11px; color: #A1A1AA; margin: 0; line-height: 1.5;">
            <strong>Method:</strong> ${order.paymentMethod === 'cash' ? 'Cash on Pickup' : 'Home Delivery'}<br />
            <strong>Address/Note:</strong> ${order.address}<br />
            <strong>ETA:</strong> ${estimatedDeliveryTime}
          </p>
        </td>
        <td style="vertical-align: top; width: 50%; padding-left: 15px; border-left: 1px solid #27272A;">
          <h4 style="font-family: 'Space Grotesk', sans-serif; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #FFFFFF; margin: 0 0 8px 0; font-style: italic;">Payment Summary</h4>
          <p style="font-size: 11px; color: #A1A1AA; margin: 0; line-height: 1.5;">
            <strong>Momo / Card / Cash:</strong> ${order.paymentMethod.toUpperCase()}<br />
            <strong>Total Items:</strong> ${totalItemsCount} items<br />
            <strong>Authorized Status:</strong> PAID & SECURED
          </p>
        </td>
      </tr>
    </table>

    <p style="margin-top: 24px; font-size: 12px; color: #A1A1AA;">If you need to make change requests to your order or delivery address, please contact our 24/7 Kigali Support directly on <strong>+250 788 000 001</strong>.</p>
  `;

  return sendEmail({
    to: userEmail,
    recipientName: userName,
    subject: `🛒 Simba Order Confirmed: #${order.orderId}`,
    body: buildEmailHtml(`🛒 Order Confirmed: #${order.orderId}`, content, "View Order History", "/profile"),
    type: 'order_confirmation',
    status: 'sent',
    metadata: { orderId: order.orderId }
  });
}

// 4. User Order Shipped (In Transit)
export async function sendOrderShipping(order: Order, userEmail: string, userName: string): Promise<string> {
  const courierPhone = `+250 788 ${Math.floor(100000 + Math.random() * 900000)}`;
  
  const content = `
    <p style="margin-top: 0;">Hi <strong>${userName}</strong>,</p>
    <p>Good news! Your premium package from Simba Supermarket for order <strong>#${order.orderId}</strong> is now packed and <strong>dispatched in transit</strong> with our dedicated delivery courier.</p>
    
    <!-- Tracking Block -->
    <div style="background-color: #111217; border: 1px solid #27272A; border-radius: 16px; padding: 24px; text-align: center; margin: 28px 0;">
      <span style="font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; color: #F59E0B; background-color: #F59E0B/10; padding: 6px 14px; border-radius: 999px; font-style: italic; border: 1px solid rgba(245, 158, 11, 0.2)">
        ⚡ Item Dispatched & In Transit
      </span>
      <h3 style="font-family: 'Space Grotesk', sans-serif; font-size: 24px; font-weight: 900; color: #FFFFFF; margin: 18px 0 6px 0; letter-spacing: -0.5px; font-style: italic;">
        ETA: 30 - 45 Minutes
      </h3>
      <p style="font-size: 11px; color: #A1A1AA; margin: 0;">Our driver is heading to your designated address: <strong>${order.address}</strong>.</p>
    </div>

    <!-- Courier Card -->
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #1C1D24; border: 1px solid #27272A; border-radius: 16px; margin: 24px 0; padding: 18px;">
      <tr>
        <td>
          <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td style="width: 44px; padding-right: 12px;">
                <div style="width: 44px; height: 44px; background-color: #E2231A; border-radius: 12px; text-align: center; line-height: 44px; color: #FFFFFF; font-weight: 900; font-size: 18px; font-style: italic;">
                  D
                </div>
              </td>
              <td>
                <p style="font-size: 12px; color: #FFFFFF; font-weight: 800; margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">Simba Express Courier Driver</p>
                <p style="font-size: 11px; color: #A1A1AA; margin: 2px 0 0 0;">Phone Contacts: <strong>${courierPhone}</strong></p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="font-size: 11px; color: #71717A;">Our driver will place a call to your number when they reach near your compound. Please keep your line active or be ready at your compound entrance.</p>
  `;

  return sendEmail({
    to: userEmail,
    recipientName: userName,
    subject: `⚡ Simba Courier Tracking: Order #${order.orderId} is Shipped!`,
    body: buildEmailHtml(`⚡ Order # ${order.orderId} Shipped!`, content, "Open Live GPS Tracking Map", "/profile"),
    type: 'order_shipped',
    status: 'sent',
    metadata: { orderId: order.orderId }
  });
}

// 5. User Order Delivered
export async function sendOrderDelivery(order: Order, userEmail: string, userName: string): Promise<string> {
  const content = `
    <p style="margin-top: 0;">Dear <strong>${userName}</strong>,</p>
    <p>Success! Your order <strong>#${order.orderId}</strong> has been confirmed as **Delivered**.</p>
    
    <div style="background-color: #101B15; border: 1px solid #14532D; border-radius: 16px; padding: 20px; color: #4ADE80; font-size: 12px; font-weight: 500; margin: 24px 0; line-height: 1.5;">
      <span style="font-weight: 900; text-transform: uppercase; font-style: italic; letter-spacing: 1px; display: block; margin-bottom: 4px;">✔ Delivery Confirmed</span>
      Your premium select grocery items have been handed over. We hope you love the freshness and quality of Simba's products!
    </div>

    <!-- Review Block with design -->
    <p>We are constantly seeking to perfect our services and delivery times in Kigali. Please take a second to rate your experience to help our staff earn high marks.</p>
  `;

  return sendEmail({
    to: userEmail,
    recipientName: userName,
    subject: `🎉 Simba Order Delivered! (Feedback requested for #${order.orderId})`,
    body: buildEmailHtml(`🎉 Order #${order.orderId} Delivered!`, content, "Rate Our Service • Get 10% Off Next", "/profile"),
    type: 'order_delivered',
    status: 'sent',
    metadata: { orderId: order.orderId }
  });
}

// 6. Supplier Demand Email (Purchase Order)
export async function sendSupplierDemand(po: PurchaseOrder, supplier: Supplier, itemsList: {name: string, quantity: number, cost: number}[]): Promise<string> {
  const poItemsRows = itemsList.map(item => `
    <tr style="border-bottom: 1px solid #27272A;">
      <td style="padding: 12px 0; font-size: 11px; color: #FFFFFF; font-weight: 700;">
        ${item.name}
      </td>
      <td style="padding: 12px 0; font-size: 11px; color: #D4D4D8; text-align: center; font-family: monospace;">
        ${item.quantity} pcs
      </td>
      <td style="padding: 12px 0; font-size: 11px; color: #D4D4D8; text-align: right; font-family: monospace;">
        ${formatCurrency(item.cost)}
      </td>
      <td style="padding: 12px 0; font-size: 11px; color: #A1A1AA; text-align: right; font-family: monospace; font-weight: 800;">
        ${formatCurrency(item.cost * item.quantity)}
      </td>
    </tr>
  `).join('');

  const stakeholderAudits = ['admin@simba.com', 'supply.chain@simba.com', 'flavmbish@gmail.com'];

  const content = `
    <p style="margin-top: 0;">Attn: <strong>${supplier.contactName}</strong> (Supply Department),</p>
    <p>This is an automated **Official Purchase Order** and stock-replenishment demand sent by Kigali Simba Supermarket. Based on our current inventory levels, we require immediate supply of the items listed below.</p>
    
    <div style="background-color: #171923; border: 1px solid #2D3748; border-radius: 16px; padding: 20px; margin: 24px 0;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0">
        <tr>
          <td style="font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; color: #71717A; font-weight: 700; padding-bottom: 12px;">PURCHASE ORDER No • ${po.id}</td>
        </tr>
      </table>
      <table width="100%" border="0" cellspacing="0" cellpadding="0">
        <thead>
          <tr style="border-bottom: 2px solid #3F3F46; text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: 1px; color: #71717A;">
            <th style="padding-bottom: 8px;">Product Description</th>
            <th style="padding-bottom: 8px; text-align: center;">Qty</th>
            <th style="padding-bottom: 8px; text-align: right;">Wholesale Cost</th>
            <th style="padding-bottom: 8px; text-align: right;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${poItemsRows}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" style="padding: 16px 0 6px 0; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #A1A1AA; font-weight: 700; text-align: right; padding-right: 15px;">TOTAL COST STIPULATION:</td>
            <td style="padding: 16px 0 6px 0; font-size: 14px; font-weight: 950; font-style: italic; color: #E2231A; text-align: right; font-family: monospace;">
              ${formatCurrency(po.totalCost)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>

    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 20px; border-top: 1px solid #27272A; padding-top: 20px;">
      <tr>
        <td style="vertical-align: top; width: 50%; padding-right: 15px;">
          <h4 style="font-family: 'Space Grotesk', sans-serif; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #FFFFFF; margin: 0 0 8px 0; font-style: italic;">Logistics & Warehouse</h4>
          <p style="font-size: 11px; color: #A1A1AA; margin: 0; line-height: 1.5;">
            <strong>Ship to:</strong> Simba Supermarket Central Warehouse<br />
            <strong>Sector:</strong> Kigali Special Economic Zone, Gasabo<br />
            <strong>Requested By Date:</strong> ${po.expectedDelivery || 'Immediate Delivery'}
          </p>
        </td>
        <td style="vertical-align: top; width: 50%; padding-left: 15px; border-left: 1px solid #27272A;">
          <h4 style="font-family: 'Space Grotesk', sans-serif; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #FFFFFF; margin: 0 0 8px 0; font-style: italic;">Finance & Credit</h4>
          <p style="font-size: 11px; color: #A1A1AA; margin: 0; line-height: 1.5;">
            <strong>Payment terms:</strong> Net 30 days invoice settlement<br />
            <strong>Recipient:</strong> ${supplier.name}<br />
            <strong>Tax Registration:</strong> VAT Inclusive RRA stipulated
          </p>
        </td>
      </tr>
    </table>

    <p style="margin-top: 24px; font-size: 11px; color: #71717A;">Please confirm receipt of this stock demand, expected loading date, and truck license registration number by clicking the official acknowledgement button below or replying to <strong>supply.chain@simba.com</strong>.</p>
  `;

  // 1. Send main PO copy to supplier
  const poId = await sendEmail({
    to: supplier.email,
    recipientName: supplier.contactName,
    subject: `📦 [SUPERMARKET DEMAND] Simba Purchase Order: #${po.id}`,
    body: buildEmailHtml(`📦 RESTOCK DEMAND: #${po.id}`, content, "Acknowledge Purchase Order", "/"),
    type: 'supplier_demand',
    status: 'sent',
    metadata: { supplierId: supplier.id, poId: po.id }
  });

  // 2. Loop to send copies to store stakeholders/managers (Multi-stakeholders communication!)
  for (const stakeholder of stakeholderAudits) {
    await sendEmail({
      to: stakeholder,
      recipientName: 'Simba Stakeholder Audit',
      subject: `🚨 [STAKEHOLDER NOTICE] Resting stock ordered for ${supplier.name} (#${po.id})`,
      body: buildEmailHtml(`🚨 RESTOCK DEMAND COPY FOR AUDITING`, `
        <p>This is a system copy of a Restock Demand letter issued to supplier <strong>${supplier.name}</strong> (${supplier.contactName}) regarding shortage. PO Code: ${po.id}.</p>
        <p>This copy is sent to active Simba managers, cash flow controllers, and developers for financial oversight compliance.</p>
        ${content}
      `),
      type: 'supplier_demand',
      status: 'sent',
      metadata: { supplierId: supplier.id, poId: po.id, isAuditorCopy: true }
    });
  }

  return poId;
}

// 7. Supplier Shipment Confirmation (Supplier to Simba)
export async function sendSupplierShipmentConfirm(po: PurchaseOrder, supplier: Supplier): Promise<string> {
  const content = `
    <p style="margin-top: 0;">Deals & Supply Team,</p>
    <p>Good news! Our partnering supplier <strong>${supplier.name}</strong> has confirmed they have **loaded and shipped** the demanded stock for Purchase Order <strong>#${po.id}</strong>.</p>
    
    <div style="background-color: #1A1C24; border: 1px solid #3F3F46; border-radius: 12px; padding: 16px; font-size: 11px; line-height: 1.6; color: #A1A1AA; margin: 20px 0;">
      <strong style="color: #FFFFFF; display: block; margin-bottom: 4px;">🚚 Dispatched Cargo Tracking Details:</strong>
      <strong>Shipped From:</strong> ${supplier.name} Warehouse Depot<br />
      <strong>Destination Address:</strong> Kigali Special Economic Zone, Gasabo<br />
      <strong>Invoice Reference Total:</strong> ${formatCurrency(po.totalCost)}<br />
      <strong>Status:</strong> DISPATCHED COURIER DEPLOYED
    </div>

    <p>Please prepare space in the Cold Chain receiving bays and mobilize store team members for physical offloading and barcode scan checking upon arrival.</p>
  `;

  return sendEmail({
    to: 'supply.chain@simba.com',
    recipientName: 'Simba Central Warehouse Stakeholder',
    subject: `🚚 [SUPPLIER SHIPPED CONFIRMATION] Restock cargo has left ${supplier.name} Depot (#${po.id})`,
    body: buildEmailHtml(`🚚Restock Cargo Shipped`, content, "View Purchase Order Ledger", "/"),
    type: 'supplier_shipment',
    status: 'sent',
    metadata: { supplierId: supplier.id, poId: po.id }
  });
}

// 8. Supplier Goods Received Confirmation (Simba received goods from Supplier)
export async function sendSupplierGoodsReceived(po: PurchaseOrder, supplier: Supplier): Promise<string> {
  const content = `
    <p style="margin-top: 0;">Attn: <strong>${supplier.contactName}</strong>,</p>
    <p>We are writing to confirm that Simba Supermarket central warehouse crew has successfully **received, validated, and logged into stock** the physical goods corresponding to Purchase Order <strong>#${po.id}</strong>.</p>
    
    <div style="background-color: #101B15; border: 1px solid #14532D; border-radius: 12px; padding: 16px; font-size: 11px; line-height: 1.5; color: #4ADE80; margin: 20px 0;">
      <strong style="display: block; margin-bottom: 4px; color: #FFFFFF;">✔ Audit Review: PERFECT FIT LOGGED</strong>
      All crates offloaded matched quantity specs with no damaged items found. The items have been registered to branch shelve counts.
    </div>

    <p>Our finance department has queued your payment invoice for disbursement according to the standard Net 30 days contract agreement. Thank you for your continued support.</p>
  `;

  // Send receipt copy to supplier
  const poId = await sendEmail({
    to: supplier.email,
    recipientName: supplier.contactName,
    subject: `✔ [GOODS RECEIVED COPY] Simba Supermarket restock confirm: #${po.id}`,
    body: buildEmailHtml(`✔ Goods Receipt Confirmed: #${po.id}`, content),
    type: 'supplier_goods_received',
    status: 'sent',
    metadata: { supplierId: supplier.id, poId: po.id }
  });

  // Also notify Simba financial controllers/stakeholders of goods logged
  await sendEmail({
    to: 'accounts@simba.com',
    recipientName: 'Simba Accounts Payable Dept',
    subject: `💳 [AP TRIGGER] Restock received for #${po.id} from ${supplier.name} • Queue net 30 payment`,
    body: buildEmailHtml(`💳 Payment Authorization: #${po.id}`, `
      <p>Simba Warehouse managers have verified and logged the restock items from <strong>${supplier.name}</strong> for <strong>Purchase Order #${po.id}</strong>.</p>
      <p>Please authorize and schedule payment of <strong>${formatCurrency(po.totalCost)}</strong> under active terms.</p>
      ${content}
    `),
    type: 'supplier_goods_received',
    status: 'sent',
    metadata: { supplierId: supplier.id, poId: po.id }
  });

  return poId;
}

// 9. Promotion Broadcast
export async function sendPromotionEmail(promotion: Promotion, customerDetails: {displayName: string, email: string}[]): Promise<number> {
  let promoDetails = '';
  if (promotion.type === 'percentage') {
    promoDetails = `<strong style="font-size: 48px; color: #E2231A; line-height: 1; display: block; margin: 10px 0;">${promotion.value}% OFF</strong>`;
  } else if (promotion.type === 'fixed') {
    promoDetails = `<strong style="font-size: 32px; color: #E2231A; line-height: 1; display: block; margin: 10px 0;">SAVE ${formatCurrency(promotion.value)}</strong>`;
  } else {
    promoDetails = `<strong style="font-size: 32px; color: #E2231A; line-height: 1; display: block; margin: 10px 0;">GET BUY-1-GET-1 DEAL</strong>`;
  }

  let count = 0;
  for (const customer of customerDetails) {
    if (!customer.email || !customer.email.includes('@')) {
      console.warn(`[Promotion Dismissed] User "${customer.displayName || 'Unknown'}" lacks a valid email address (${customer.email || 'None'}).`);
      continue;
    }
    
    try {
      const content = `
        <p style="margin-top: 0; text-align: center;">Mwaramutse <strong>${customer.displayName || 'Customer'}</strong>,</p>
        <p style="text-align: center;">Exclusive promotion just for you! Simba brings special savings on your favorite food, drinks, and daily household supplies this week in Kigali!</p>
        
        <!-- Huge Promo Card -->
        <div style="background: linear-gradient(135deg, #1A1C24 0%, #0E0F12 100%); border: 2px dashed #E2231A; border-radius: 20px; padding: 32px; text-align: center; margin: 28px 0; box-shadow: 0 4px 20px rgba(226, 35, 26, 0.1);">
          <span style="font-size: 9px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; color: #FFFFFF; opacity: 0.6;">KIGALI SEASONAL DEAL PRESENTS:</span>
          <h2 style="font-family: 'Space Grotesk', sans-serif; font-size: 26px; font-weight: 900; color: #FFFFFF; margin: 12px 0 0 0; text-transform: uppercase; font-style: italic; letter-spacing: -0.5px;">
            ${promotion.name}
          </h2>
          
          ${promoDetails}
          
          <p style="font-size: 11px; color: #A1A1AA; margin-top: 14px; margin-bottom: 0;">Use coupon checkout code <strong style="color: #FFFFFF; font-family: monospace; font-size: 14px; letter-spacing: 1px; background-color: #27272A; padding: 3px 8px; border-radius: 6px;">SIMBAWEEK</strong> or visit our branch closest to you to grab the stock!</p>
        </div>

        <p style="text-align: center; font-size: 11px; color: #71717A; margin-top: 24px;">This offer is valid until <strong>${promotion.endDate ? new Date(promotion.endDate.seconds ? promotion.endDate.seconds * 1000 : promotion.endDate).toLocaleDateString() : 'this Sunday'}</strong> in Nyarutarama, Kimironko, Remera and all branches.</p>
      `;

      await sendEmail({
        to: customer.email.trim(),
        recipientName: customer.displayName || 'Valued Customer',
        subject: `🎉 [PROMOTION SPECIAL] ${promotion.name} at Simba Supermarket!`,
        body: buildEmailHtml(`🎉 EXCLUSIVE DEALS IN KIGALI`, content, "Shop Simba Online Deals Now", "/"),
        type: 'promotion_broadcast',
        status: 'sent',
        metadata: { promotionId: promotion.id }
      });
      count++;
    } catch (err) {
      console.error(`[Promotion Error] Could not dispatch to ${customer.email}:`, err);
    }
  }

  return count;
}
