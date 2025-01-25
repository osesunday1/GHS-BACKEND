const express = require('express');
const productController = require('../controllers/productController');
const router = express.Router();



// Destructure the Product-related controllers
const {
    createProductItem,
    getAllProductItems,
    getProductItemById,
    updateProductItem,
    deleteProductItem
  } = productController;


router
    .route('/')
    .post(createProductItem)
    .get(getAllProductItems);

router
    .route('/:id')
    .get(getProductItemById)
    .put(updateProductItem)
    .delete(deleteProductItem);

module.exports = router;