interface InvoiceData {
  invoiceNumber: string;
  date: Date;
  eventTitle: string;
  eventDate: Date;
  attendeeName: string;
  attendeeEmail: string;
  company?: string;
  price: number;
  currency: string;
  registrationId: string;
}

export function generateInvoiceHTML(data: InvoiceData): string {
  const formattedDate = data.date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const formattedEventDate = data.eventDate.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // LE PRIX ENTRÉ PAR L'UTILISATEUR EST TTC (PRIX FINAL)
  const totalTTC = data.price;           // Prix TTC = prix entré
  const totalHT = totalTTC / 1.20;       // Prix HT = TTC / 1.20
  const tva = totalTTC - totalHT;        // TVA = TTC - HT

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Facture ${data.invoiceNumber}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Arial', sans-serif;
      color: #333;
      line-height: 1.6;
      padding: 40px;
      background: #f5f5f5;
    }
    
    .invoice-container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      padding: 60px;
      box-shadow: 0 0 20px rgba(0,0,0,0.1);
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 50px;
      padding-bottom: 30px;
      border-bottom: 3px solid #0ea5e9;
    }
    
    .company-info h1 {
      color: #0ea5e9;
      font-size: 32px;
      margin-bottom: 10px;
    }
    
    .company-info p {
      color: #666;
      font-size: 14px;
    }
    
    .invoice-info {
      text-align: right;
    }
    
    .invoice-info h2 {
      font-size: 28px;
      color: #333;
      margin-bottom: 10px;
    }
    
    .invoice-info p {
      color: #666;
      font-size: 14px;
    }
    
    .invoice-number {
      font-weight: bold;
      color: #0ea5e9;
    }
    
    .billing-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      margin-bottom: 50px;
    }
    
    .billing-section h3 {
      color: #0ea5e9;
      font-size: 16px;
      margin-bottom: 15px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .billing-section p {
      margin-bottom: 5px;
      font-size: 14px;
    }
    
    .items-table {
      width: 100%;
      margin-bottom: 40px;
      border-collapse: collapse;
    }
    
    .items-table thead {
      background: #0ea5e9;
      color: white;
    }
    
    .items-table th {
      padding: 15px;
      text-align: left;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 12px;
      letter-spacing: 1px;
    }
    
    .items-table td {
      padding: 20px 15px;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .items-table tbody tr:hover {
      background: #f9fafb;
    }
    
    .text-right {
      text-align: right;
    }
    
    .totals {
      margin-left: auto;
      width: 300px;
    }
    
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      font-size: 14px;
    }
    
    .totals-row.subtotal {
      border-bottom: 1px solid #e5e7eb;
    }
    
    .totals-row.total {
      border-top: 2px solid #0ea5e9;
      margin-top: 10px;
      padding-top: 15px;
      font-size: 18px;
      font-weight: bold;
      color: #0ea5e9;
    }
    
    .footer {
      margin-top: 60px;
      padding-top: 30px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #666;
      font-size: 12px;
    }
    
    .footer p {
      margin-bottom: 5px;
    }
    
    .payment-status {
      display: inline-block;
      padding: 8px 20px;
      background: #10b981;
      color: white;
      border-radius: 20px;
      font-weight: bold;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-top: 20px;
    }
    
    @media print {
      body {
        padding: 0;
        background: white;
      }
      
      .invoice-container {
        box-shadow: none;
        padding: 40px;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <!-- Header -->
    <div class="header">
      <div class="company-info">
        <h1>Business Events</h1>
        <p>Plateforme d'événements professionnels</p>
        <p>contact@businessevents.com</p>
      </div>
      <div class="invoice-info">
        <h2>FACTURE</h2>
        <p class="invoice-number">N° ${data.invoiceNumber}</p>
        <p>Date: ${formattedDate}</p>
      </div>
    </div>
    
    <!-- Billing Information -->
    <div class="billing-info">
      <div class="billing-section">
        <h3>Facturé à</h3>
        <p><strong>${data.attendeeName}</strong></p>
        ${data.company ? `<p>${data.company}</p>` : ''}
        <p>${data.attendeeEmail}</p>
      </div>
      <div class="billing-section">
        <h3>Détails de l'événement</h3>
        <p><strong>${data.eventTitle}</strong></p>
        <p>${formattedEventDate}</p>
        <p>ID: ${data.registrationId}</p>
      </div>
    </div>
    
    <!-- Items Table -->
    <table class="items-table">
      <thead>
        <tr>
          <th>Description</th>
          <th class="text-right">Quantité</th>
          <th class="text-right">Prix unitaire</th>
          <th class="text-right">Total HT</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <strong>Inscription - ${data.eventTitle}</strong><br>
            <small style="color: #666;">Billet d'entrée pour l'événement</small>
          </td>
          <td class="text-right">1</td>
          <td class="text-right">${totalHT.toFixed(2)} ${data.currency}</td>
          <td class="text-right">${totalHT.toFixed(2)} ${data.currency}</td>
        </tr>
      </tbody>
    </table>
    
    <!-- Totals -->
    <div class="totals">
      <div class="totals-row subtotal">
        <span>Sous-total HT:</span>
        <span>${totalHT.toFixed(2)} ${data.currency}</span>
      </div>
      <div class="totals-row">
        <span>TVA (20%):</span>
        <span>${tva.toFixed(2)} ${data.currency}</span>
      </div>
      <div class="totals-row total">
        <span>TOTAL TTC:</span>
        <span>${totalTTC.toFixed(2)} ${data.currency}</span>
      </div>
    </div>
    
    <div style="text-align: center;">
      <span class="payment-status">✓ PAYÉ</span>
    </div>
    
    <!-- Footer -->
    <div class="footer">
      <p><strong>Business Events</strong></p>
      <p>SIRET: 123 456 789 00012 | TVA: FR12345678901</p>
      <p>123 Avenue des Champs-Élysées, 75008 Paris, France</p>
      <p style="margin-top: 20px;">Merci pour votre confiance !</p>
    </div>
  </div>
</body>
</html>
  `;
}

export function generateInvoiceNumber(registrationId: string, date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const shortId = registrationId.substring(0, 8).toUpperCase();
  return `INV-${year}${month}-${shortId}`;
}
