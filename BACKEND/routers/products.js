const { Product } = require('../models/product');
const express = require('express');
const { Category } = require('../models/category');
const router = express.Router();
const mongoose = require('mongoose');
const { filter } = require('mongoose/lib/helpers/query/validOps');
const multer = require('multer');
const { route } = require('express/lib/application');
const { response } = require('express');

const FILE_TYPE_MAP = {
    'image/png': 'png',
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpg',
};
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const isValid = FILE_TYPE_MAP[file.mimetype];
        let uploadError = new Error('invalid image type');
        if (isValid) {
            uploadError = null;
        }
        cb(uploadError, 'public/uploads');
    },
    filename: function (req, file, cb) {
        const fileName = file.originalname.split(' ').join('-');
        const extension = FILE_TYPE_MAP[file.mimetype];
        cb(null, `${fileName}-${Date.now()}.${extension}`);
    },
});

const uploadOptions = multer({ storage: storage });

//Get all product
router.get(`/`, async (req, res) => {
    //localhost:3000/api/v1/products?categories=123,123
    let filter = {};
    if (req.query.categories) {
        filter = { category: req.query.categories.split(',') };
    }

    const productList = await Product.find(filter).populate('category');

    if (!productList) {
        res.status(500).json({ success: false });
    }
    res.send(productList);
});

//Get product by id
router.get(`/:id`, async (req, res) => {
    const product = await Product.findById(req.params.id).populate('category');
    if (!product) {
        res.status(500).json({ success: false });
    }
    res.send(product);
});

//create product
router.post(`/`, uploadOptions.single('image'), async (req, res) => {
    const category = await Category.findById(req.body.category);
    if (!category) return res.status(400).send('Invalid Category');
    const file = req.file;
    if (!file) return res.status(400).send('No file in request');

    //'http://localhost:3000/public/upload/image-124135142'
    const fileName = req.file.filename;
    const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;
    let product = new Product({
        name: req.body.name,
        description: req.body.description,
        richDescription: req.body.richDescription,
        image: `${basePath}${fileName}`,
        brand: req.body.brand,
        price: req.body.price,
        category: req.body.category,
        countInStock: req.body.countInStock,
        rating: req.body.rating,
        numReviews: req.body.numReviews,
        isFeatured: req.body.isFeatured,
    });

    product = await product.save();

    if (!product) {
        return res.status(400).send('The product can not be created');
    }
    res.send(product);
});

//Update product
router.put('/:id', async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).send('Invalid Product Id ');
    }
    const category = await Category.findById(req.body.category);
    if (!category) return res.status(400).send('Invalid Category');

    const product = await Product.findById(req.body.id);
    if (!product) return res.status(400).send('Invalid Product');
    const file = req.file;
    let imagesPath;
    if (file) {
        const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;
        imagesPath = `${basePath}${fileName}`;
    } else {
        imagesPath = product.image;
    }

    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, {
        name: req.body.name,
        description: req.body.description,
        richDescription: req.body.richDescription,
        image: imagesPath,
        brand: req.body.brand,
        price: req.body.price,
        category: req.body.category,
        countInStock: req.body.countInStock,
        rating: req.body.rating,
        numReviews: req.body.numReviews,
        isFeatured: req.body.isFeatured,
    });
    if (!updatedProduct) {
        res.status(400).send('The product can not be update');
    }
    res.send(updatedProduct);
});

//Delete product
router.delete('/:id', (req, res) => {
    Product.findByIdAndRemove(req.params.id)
        .then(product => {
            if (product) {
                return res.status(200).json({
                    success: true,
                    message: 'The product is deleted',
                });
            } else {
                return res.status(200).json({
                    success: false,
                    message: 'Product not found !',
                });
            }
        })
        .catch(err => {
            return res.status(400).json({
                success: false,
                error: err,
            });
        });
});

//Count product
router.get(`/get/count`, async (req, res) => {
    const productCount = await Product.countDocuments();
    if (!productCount) {
        res.status(500).json({ success: false });
    }
    res.send({
        productCount: productCount,
    });
});

//Feature product
router.get(`/get/featured/:count`, async (req, res) => {
    const count = req.params.count ? req.params.count : 0;
    const productFeatured = await Product.find({ isFeatured: true }).limit(
        +count,
    );
    if (!productFeatured) {
        res.status(500).json({ success: false });
    }
    res.send(productFeatured);
});

//upload gallery
router.put(
    '/gallery-images/:id',
    uploadOptions.array('images', 10),
    async (req, res) => {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).send('Invalid Product Id');
        }
        const files = req.files;
        let imagesPaths = [];
        const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;
        if (files) {
            files.map(file => {
                imagesPaths.push(`${basePath}${file.filename}`);
            });
        }

        const product = await Product.findByIdAndUpdate(
            req.params.id,
            {
                images: imagesPaths,
            },
            { new: true },
        );
        if (!product) {
            return res.status(400).send('The product can not be created');
        }
        res.send(product);
    },
);
module.exports = router;
