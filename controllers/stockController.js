const Product = require('../model/productModel');
const StockLog = require('../model/StockLogModel');





exports.getStockHistory = async (req, res, next) => {
  try {
    const logs = await StockLog.find()
      .populate('productId', 'name sku') // get product name and SKU
      .sort({ date: -1 }); // most recent first

    res.status(200).json(logs);
  } catch (err) {
    console.error('Failed to fetch stock history:', err);
    res.status(500).json({ message: 'Failed to fetch stock history' });
  }
};


// Add stock (IN)
exports.addStock = async (req, res) => {
  try {
    const { productId, quantity, note } = req.body;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    product.quantity += quantity;
    await product.save();

    const log = await StockLog.create({
      productId,
      changeType: 'IN',
      quantityChanged: quantity,
      note,
    });

    res.status(200).json({ message: 'Stock added', product, log });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add stock' });
  }
};

//  Remove stock (OUT)
exports.removeMultipleStock = async (req, res) => {
  try {
    const { customerName, products } = req.body;
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: 'Products array is required' });
    }

    const results = [];
    const now = new Date();
    const transactionId = `${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`;

    for (const item of products) {
      const { productId, quantity, note } = item;
      const product = await Product.findById(productId);
      if (!product) throw new Error(`Product not found: ${productId}`);
      if (product.quantity < quantity) throw new Error(`Insufficient stock for ${product.name}`);

      product.quantity -= quantity;
      await product.save();

      const total = quantity * product.sellingPrice;

      const log = await StockLog.create({
        transactionId,
        productId,
        changeType: 'OUT',
        quantityChanged: quantity,
        unitPrice: product.sellingPrice,
        marketPrice: product.marketPrice,
        total,
        note,
        customerName,
      });

      results.push(log);
    }

    res.status(200).json({ message: 'Products sold successfully', transactionId, logs: results });
  } catch (err) {
    console.error('[removeMultipleStock] Error:', err);
    res.status(500).json({ error: 'Failed to sell products', details: err.message });
  }
};



//  Adjust stock manually (ADJUST)
exports.adjustStock = async (req, res) => {
  try {
    const { productId, quantity, note } = req.body;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    product.quantity = quantity;
    await product.save();

    const log = await StockLog.create({
      productId,
      changeType: 'ADJUST',
      quantityChanged: quantity, // You may want to calculate the delta if needed
      note,
    });

    res.status(200).json({ message: 'Stock adjusted', product, log });
  } catch (err) {
    res.status(500).json({ error: 'Failed to adjust stock' });
  }
};

//update log history

exports.updateStockLog = async (req, res) => {
  try {
    console.log('[updateStockLog] Incoming payload:', req.body);

    const log = await StockLog.findById(req.params.id);
    if (!log) {
      console.log('[updateStockLog] Log not found for ID:', req.params.id);
      return res.status(404).json({ error: 'Log not found' });
    }

    const product = await Product.findById(log.productId);
    if (!product) {
      console.log('[updateStockLog] Product not found for ID:', log.productId);
      return res.status(404).json({ error: 'Product not found' });
    }

    const newQty = parseInt(req.body.quantityChanged);
    const prevQty = log.quantityChanged;
    console.log(`[updateStockLog] Previous quantity: ${prevQty}, New quantity: ${newQty}`);

    if (isNaN(newQty)) {
      console.log('[updateStockLog] Invalid quantity provided');
      return res.status(400).json({ error: 'Invalid quantity value' });
    }

    const diff = newQty - prevQty;
    console.log(`[updateStockLog] Calculated quantity difference: ${diff}`);

    if (log.changeType === 'IN') {
      console.log('[updateStockLog] Change type is IN, adjusting product quantity by:', diff);
      await Product.updateOne({ _id: product._id }, { $inc: { quantity: diff } });
    }

    if (log.changeType === 'OUT') {
      console.log('[updateStockLog] Change type is OUT, adjusting product quantity by:', -diff);
      await Product.updateOne({ _id: product._id }, { $inc: { quantity: -diff } });
    }

    log.quantityChanged = newQty;
    log.note = req.body.note || '';
    log.customerName = req.body.customerName || '';
    await log.save();

    console.log('[updateStockLog] Log updated successfully:', log);

    res.status(200).json({ message: 'Log updated successfully', log });
  } catch (err) {
    console.error('[updateStockLog] Error occurred:', err);
    res.status(500).json({ error: 'Failed to update stock log', details: err.message });
  }
};

//delete log history

exports.deleteStockLog = async (req, res) => {
  try {
    const log = await StockLog.findById(req.params.id);
    if (!log) return res.status(404).json({ error: 'Log not found' });

    const product = await Product.findById(log.productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    let updateQty = product.quantity;

    if (log.changeType === 'IN') updateQty -= log.quantityChanged;
    if (log.changeType === 'OUT') updateQty += log.quantityChanged;

    await Product.updateOne(
      { _id: product._id },
      { $set: { quantity: updateQty } }
    );

    await log.deleteOne();

    res.status(200).json({ message: 'Stock log deleted and inventory adjusted' });
  } catch (err) {
    console.error('[deleteStockLog] Error:', err);
    res.status(500).json({ error: 'Failed to delete log', details: err.message });
  }
};

//view single  log 
exports.getSingleStockLog = async (req, res) => {
  try {
    const log = await StockLog.findById(req.params.id)
      .populate('productId', 'name sku');

    if (!log) return res.status(404).json({ error: 'Stock log not found' });

    res.status(200).json(log);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stock log', details: err.message });
  }
};