const PDFDocument = require('pdfkit');

/**
 * Generates a professional GST-compliant Kirana tax invoice PDF in memory as a Buffer
 *
 * @param {object} invoice - Full invoice Mongoose document or plain object
 * @param {object} shop - Full shop Mongoose document or plain object
 * @returns {Promise<Buffer>} PDF file buffer
 */
const generateInvoicePDF = (invoice, shop) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 40,
        size: 'A4',
        info: {
          Title: `Invoice-${invoice.invoiceNumber}`,
          Author: shop.shopName || 'Dukaan Sahayak',
        },
      });

      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      const primaryColor = '#1e3a8a'; // Deep Navy Blue
      const secondaryColor = '#475569'; // Slate Grey
      const darkColor = '#0f172a';
      const lightBg = '#f1f5f9';

      // ----------------- HEADER SECTION -----------------
      doc
        .fillColor(primaryColor)
        .fontSize(22)
        .font('Helvetica-Bold')
        .text(shop.shopName || 'Kirana Store', 40, 40);

      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor(secondaryColor);

      if (shop.address) {
        doc.text(shop.address, 40, 68);
      }
      if (shop.phone) {
        doc.text(`Phone: ${shop.phone}`, 40, 80);
      }
      if (shop.gstin) {
        doc.font('Helvetica-Bold').text(`GSTIN: ${shop.gstin}`, 40, 92).font('Helvetica');
      }

      // Title & Invoice Meta on the right
      doc
        .fillColor(primaryColor)
        .fontSize(18)
        .font('Helvetica-Bold')
        .text('TAX INVOICE', 350, 40, { align: 'right' });

      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor(darkColor)
        .text(`Invoice No: ${invoice.invoiceNumber}`, 350, 68, { align: 'right' })
        .text(
          `Date: ${new Date(invoice.createdAt || Date.now()).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}`,
          350,
          80,
          { align: 'right' }
        )
        .text(`Status: ${(invoice.paymentStatus || 'PAID').toUpperCase()}`, 350, 92, {
          align: 'right',
        })
        .text(`Payment: ${(invoice.paymentMethod || 'CASH').toUpperCase()}`, 350, 104, {
          align: 'right',
        });

      // Divider line
      doc
        .strokeColor('#cbd5e1')
        .lineWidth(1)
        .moveTo(40, 125)
        .lineTo(555, 125)
        .stroke();

      // ----------------- BILL TO SECTION -----------------
      doc
        .fillColor(primaryColor)
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('BILL TO:', 40, 135);

      const customer = invoice.customerSnapshot || {};
      doc
        .fillColor(darkColor)
        .fontSize(10)
        .font('Helvetica-Bold')
        .text(customer.name || 'Cash Customer', 40, 150);

      doc.font('Helvetica').fontSize(9).fillColor(secondaryColor);
      if (customer.phone) {
        doc.text(`Phone: ${customer.phone}`, 40, 164);
      }
      if (customer.address) {
        doc.text(customer.address, 40, 176);
      }

      // ----------------- TABLE HEADER -----------------
      const tableTop = 205;
      doc
        .rect(40, tableTop, 515, 22)
        .fill(lightBg)
        .strokeColor('#cbd5e1')
        .stroke();

      doc
        .fillColor(darkColor)
        .fontSize(9)
        .font('Helvetica-Bold');

      doc.text('#', 45, tableTop + 6, { width: 20 });
      doc.text('Item Description', 70, tableTop + 6, { width: 170 });
      doc.text('HSN', 245, tableTop + 6, { width: 45 });
      doc.text('Qty', 295, tableTop + 6, { width: 45, align: 'right' });
      doc.text('Rate', 345, tableTop + 6, { width: 50, align: 'right' });
      doc.text('GST %', 400, tableTop + 6, { width: 45, align: 'right' });
      doc.text('Total (INR)', 450, tableTop + 6, { width: 100, align: 'right' });

      // ----------------- TABLE BODY -----------------
      let currentY = tableTop + 26;
      doc.font('Helvetica').fontSize(9).fillColor(darkColor);

      (invoice.items || []).forEach((item, index) => {
        // Handle pagination if needed
        if (currentY > 700) {
          doc.addPage();
          currentY = 50;
        }

        const itemName = item.productSnapshot?.name || 'Product';
        const hsn = item.productSnapshot?.hsnCode || '-';
        const qty = `${item.quantity} ${item.unit || 'pcs'}`;
        const rate = (item.unitPrice || 0).toFixed(2);
        const gst = `${item.taxRate || 0}%`;
        const total = (item.lineTotal || 0).toFixed(2);

        doc.text(String(index + 1), 45, currentY, { width: 20 });
        doc.text(itemName, 70, currentY, { width: 170 });
        doc.text(hsn, 245, currentY, { width: 45 });
        doc.text(qty, 295, currentY, { width: 45, align: 'right' });
        doc.text(rate, 345, currentY, { width: 50, align: 'right' });
        doc.text(gst, 400, currentY, { width: 45, align: 'right' });
        doc.text(total, 450, currentY, { width: 100, align: 'right' });

        currentY += 20;

        // Subtle row separator
        doc
          .strokeColor('#f1f5f9')
          .lineWidth(0.5)
          .moveTo(40, currentY - 4)
          .lineTo(555, currentY - 4)
          .stroke();
      });

      // ----------------- TOTALS SECTION -----------------
      currentY += 10;
      if (currentY > 680) {
        doc.addPage();
        currentY = 50;
      }

      const totalsBoxX = 350;
      doc
        .strokeColor('#cbd5e1')
        .lineWidth(1)
        .moveTo(totalsBoxX, currentY)
        .lineTo(555, currentY)
        .stroke();

      currentY += 8;
      doc.font('Helvetica').fontSize(9);
      doc.text('Subtotal:', totalsBoxX, currentY, { width: 100 });
      doc.text(`INR ${(invoice.subtotal || 0).toFixed(2)}`, totalsBoxX + 100, currentY, {
        align: 'right',
        width: 105,
      });

      currentY += 16;
      doc.text('Total GST Tax:', totalsBoxX, currentY, { width: 100 });
      doc.text(`INR ${(invoice.taxTotal || 0).toFixed(2)}`, totalsBoxX + 100, currentY, {
        align: 'right',
        width: 105,
      });

      if (invoice.discountAmount && invoice.discountAmount > 0) {
        currentY += 16;
        doc.text('Discount:', totalsBoxX, currentY, { width: 100 });
        doc.text(`- INR ${(invoice.discountAmount || 0).toFixed(2)}`, totalsBoxX + 100, currentY, {
          align: 'right',
          width: 105,
        });
      }

      currentY += 20;
      doc
        .rect(totalsBoxX, currentY - 4, 205, 24)
        .fill(lightBg)
        .strokeColor(primaryColor)
        .stroke();

      doc
        .fillColor(primaryColor)
        .font('Helvetica-Bold')
        .fontSize(11)
        .text('Grand Total:', totalsBoxX + 6, currentY + 3, { width: 90 });
      doc.text(
        `INR ${(invoice.total || 0).toFixed(2)}`,
        totalsBoxX + 90,
        currentY + 3,
        { align: 'right', width: 105 }
      );

      // Notes
      if (invoice.notes) {
        doc
          .fillColor(secondaryColor)
          .fontSize(9)
          .font('Helvetica-Oblique')
          .text(`Notes: ${invoice.notes}`, 40, currentY + 35, { width: 280 });
      }

      // ----------------- FOOTER SECTION -----------------
      doc
        .fontSize(8)
        .font('Helvetica')
        .fillColor(secondaryColor)
        .text(
          'Thank you for your business! | This is a computer-generated invoice powered by Dukaan Sahayak.',
          40,
          780,
          { align: 'center', width: 515 }
        );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  generateInvoicePDF,
};
