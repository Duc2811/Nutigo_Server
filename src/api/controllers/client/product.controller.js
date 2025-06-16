const Product = require('../../models/product')
const PaginationHelper = require('../../../helper/pagination')
const User = require('../../models/user')
const Category = require('../../models/category')
const SubCategory = require('../../models/subCategory')
const Sale = require('../../models/sale');


//[Post] api/products/addProducts
module.exports.addProduct = async (req, res) => {
    try {
        const { subcategoryId } = req.params;
        const { name, price, image, description, quantity, sold, saleOf, salePrice } = req.body;
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];


        if (!token) {
            return res.status(401).json({ message: 'Token is missing or invalid!' });
        }

        const productManager = await User.findOne({ token });
        if (!productManager || productManager.role !== 'productManager') {
            return res.status(401).json({ message: 'User not authorized to add product or User not found!!!' });
        }

        const subcategoryDoc = await SubCategory.findOne({ _id: subcategoryId });
        if (!subcategoryDoc) {
            return res.status(400).json({
                message: 'SubCategory not found!'
            });
        }

        const existingProduct = await Product.findOne({ name });
        if (existingProduct) {
            return res.status(400).json({ message: 'Product with this name already exists!' });
        }

        const product = new Product({
            productManager: productManager._id,
            name,
            price,
            image,
            description,
            subCategory: subcategoryDoc._id,
            quantity,
            sold,
            saleOf,
            salePrice
        });

        await product.save();

        res.status(201).json({ message: 'Product created successfully', product });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error creating product: ' + err.message });
    }
};


//[Put] api/products/updateProduct/:id
module.exports.updateProduct = async (req, res) => {
    try {
        const { productId, name, price, description, subCategory } = req.body;
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Token is missing or invalid!' });
        }

        const productManager = await User.findOne({ token });
        if (!productManager || productManager.role !== 'productManager') {
            return res.status(403).json({ message: 'User not authorized to update product!' });
        }

        // Kiểm tra xem productId có hợp lệ không
        if (!productId) {
            return res.status(400).json({ message: 'Invalid product ID!' });
        }
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found!' });
        }

        // Kiểm tra subCategory nếu được gửi
        if (subCategory) {
            return res.status(400).json({ message: 'Invalid subCategory ID!' });
        }

        if (subCategory) {
            const subCategoryDoc = await SubCategory.findById(subCategory);
            if (!subCategoryDoc) {
                return res.status(400).json({ message: 'SubCategory not found!' });
            }
        }

        // Cập nhật chỉ những trường có thay đổi
        product.name = name || product.name;
        product.price = price || product.price;
        product.description = description || product.description;
        product.subCategory = subCategory || product.subCategory;

        await product.save();

        return res.status(200).json({ message: 'Product updated successfully', product });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Error updating product: ' + err.message });
    }
};


//[Delete] api/products/managerDelete/:id
module.exports.managerDeleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Token is missing or invalid!' });
        }
        const productManager = await User.findOne({ token: token });
        if (!productManager || productManager.role !== 'productManager') {
            return res.status(401).json({ message: 'User not authorized to delete product or User not found!!!' });
        }
        const deleteProduct = await Product.findByIdAndDelete(id);
        if (!deleteProduct) {
            return res.status(404).json({ message: 'Product not found.' })
        }
        res.status(200).json({ message: 'Product deleted successfully.' })

    } catch (error) {
        res.status(500).json(`Delete product error: ` + error.message)
    }
}

//[Delete] api/products/adminDelete

module.exports.adminDeleteProduct = async (req, res) => {
    try {
        const { id } = req.params.id;
        const deleteProduct = await Product.findByIdAndDelete(id);
        if (!deleteProduct) {
            return res.status(404).json({ message: 'Product not found.' })
        }
        res.status(200).json({ message: 'Product deleted successfully.' })
    } catch (error) {
        res.status(500).json(`Delete product error: ` + error.message)
    }
}

// [GET] api/products/search?query=
module.exports.searchProducts = async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name && !description) {
            return res.status(400).json({ message: 'Please provide a valid name or description to search.' });
        }

        let productsQuery = {
            deleted: false
        };

        // Thêm điều kiện tìm kiếm theo tên và mô tả
        if (name) {
            productsQuery.name = { $regex: name, $options: "i" }; // Tìm kiếm không phân biệt chữ hoa chữ thường
        }

        if (description) {
            productsQuery.description = { $regex: description, $options: "i" };
        }

        // Tính tổng số sản phẩm
        const totalProducts = await Product.countDocuments(productsQuery);

        if (totalProducts === 0) {
            return res.status(404).json({ message: 'No products found.' });
        }

        // Phân trang với dữ liệu từ query parameters
        const paginationData = await PaginationHelper(
            {
                currentPage: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 12
            },
            totalProducts,
            req.query
        );

        // Lấy danh sách sản phẩm theo điều kiện tìm kiếm và phân trang
        const products = await Product.find(productsQuery)
            .skip(paginationData.skip)
            .limit(paginationData.limit)
            .sort({ createdAt: -1 }); // Sắp xếp theo ngày tạo, có thể thay đổi

        // Trả về kết quả tìm kiếm và thông tin phân trang
        res.status(200).json({
            message: 'Products found',
            products,
            totalPage: paginationData.totalPage,
            currentPage: paginationData.currentPage,
            totalProducts: totalProducts
        });
    } catch (error) {
        res.status(500).json({ message: `Search product error: ${error.message}` });
    }
};



// [GET] api/products/getAllProducts
module.exports.getAllProducts = async (req, res) => {
    try {
        const totalProducts = await Product.countDocuments({ deleted: false })
        if (totalProducts === 0) {
            return res.status(404).json({ message: 'No products found.' })
        }
        const paginationData = await PaginationHelper({
            currentPage: 1,
            limit: 12,
        },
            totalProducts,
            req.query
        )
        const products = await Product.find({ deleted: false })
            .skip(paginationData.skip)
            .limit(paginationData.limit)
            .sort({ createdAt: -1 })
            .lean(); // Dùng lean() để lấy dữ liệu nhanh hơn khi không cần thao tác mongoose document

        // Lấy danh sách sale theo productId
        const productIds = products.map(p => p._id);
        const sales = await Sale.find({ productId: { $in: productIds } }).lean();

        // Gộp dữ liệu sale vào danh sách sản phẩm
        const productsWithSale = products.map(product => {
            const saleInfo = sales.find(sale => sale.productId.toString() === product._id.toString());
            return {
                ...product,
                sale: saleInfo || null, // Nếu không có khuyến mãi thì để null
            };
        });

        res.status(200).json({
            products: productsWithSale,
            totalPage: paginationData.totalPage,
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Internal Server Error', error });
    }
};


// [GET] api/products/:id
module.exports.getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: 'Please provide a product id.' });
        }

        const product = await Product.findByIdAndUpdate(
            id,
            { $inc: { numReviews: 1 } },
            { new: true }
        );

        if (!product) {
            return res.status(404).json({ message: 'Product not found.' });
        }
        res.status(200).json({
            product,
            message: 'Product found',
        });
    } catch (error) {
        res.status(500).json({
            error: error.message || 'An error occurred while fetching the product.',
        });
    }
};


// [GET] api/products/getProductByCategory/category
module.exports.getProductByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        if (!category) {
            return res.status(400).json({ message: 'Please provide a category.' })
        }

        const categories = await Category.findOne({ name: category });
        if (!categories) {
            return res.status(404).json({ message: 'Category not found.' })
        }
        const totalProducts = await Product.countDocuments({
            category: categories._id,
            deleted: false
        })
        if (totalProducts === 0) {
            return res.status(404).json({ message: 'No products found.' })
        }
        const paginationData = await PaginationHelper({
            currentPage: 1,
            limit: 12,
        },
            totalProducts,
            req.query
        );

        const products = await Product.find({ category: categories._id })
            .skip(paginationData.skip)
            .limit(paginationData.limit)
            .sort({ createdAt: -1 });
        if (!products || products === null) {
            return res.status(404).json({ message: 'Product not found.' })
        }
        res.status(200).json({
            products,
            totalPage: paginationData.totalPage
        })
    } catch (error) {
        res.status(500).json(error)
    }
}


//[GET] api/product/getProductBySubCategory/subcategory
module.exports.getProductBySubCategory = async (req, res) => {
    try {
        const { subcategoryId } = req.params;
        const { page } = req.body;
        const subcategoryDoc = await SubCategory.findOne({ _id: subcategoryId });

        if (!subcategoryDoc) {
            return res.status(400).json({ code: 400, message: 'Please provide a valid subcategory.' });
        }

        const totalProducts = await Product.countDocuments({ subCategory: subcategoryDoc._id, deleted: false });

        const paginationData = {
            currentPage: page ? parseInt(page) : 1,
            limit: 12,
        };

        const products = await Product.find({ subCategory: subcategoryDoc._id, deleted: false })
            .populate('subCategory', 'name')
            .skip((paginationData.currentPage - 1) * paginationData.limit)
            .limit(paginationData.limit);

        if (products.length === 0) {
            return res.status(404).json({ message: `No products found under SubCategory: ${subcategoryId}` });
        }

        res.status(200).json({
            products,
            pagination: paginationData,
            message: `Products under SubCategory: ${subcategoryId}`
        });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error });
    }
}

//[GET] api/product/getTop8
module.exports.getTop8 = async (req, res) => {
    try {

        const products = await Product.find({ deleted: false })
            .sort({ rating: -1 })
            .limit(8);

        const activeSales = await Sale.find({
            productId: { $in: products.map(product => product._id) },
        });

        const salesMap = {};
        activeSales.forEach(sale => {
            salesMap[sale.productId.toString()] = {
                isSale: sale.isSale,
                discount: sale.salePrice,
                discountType: sale.discountType,
                startDate: sale.startDate,
                endDate: sale.endDate,
                salePrice: sale.salePrice,
            };
        });

        const productsWithSales = products.map(product => {
            const productObj = product.toObject();
            productObj.sale = salesMap[product._id.toString()] || null;
            return productObj;
        });

        res.status(200).json({
            products: productsWithSales
        });
    } catch (error) {
        console.error('Error in getTop8:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


//[GET] api/getTopView
module.exports.getTopView = async (req, res) => {
    try {
        const products = await Product.find({ deleted: false })
            .sort({ numReviews: -1 })
            .limit(8);

        const activeSales = await Sale.find({
            productId: { $in: products.map(product => product._id) },
        });

        const salesMap = {};
        activeSales.forEach(sale => {
            salesMap[sale.productId.toString()] = {
                isSale: sale.isSale,
                discount: sale.salePrice,
                discountType: sale.discountType,
                startDate: sale.startDate,
                endDate: sale.endDate,
                salePrice: sale.salePrice,
            };
        });

        const productsWithSales = products.map(product => {
            const productObj = product.toObject();
            productObj.sale = salesMap[product._id.toString()] || null;
            return productObj;
        });

        res.status(200).json({
            products: productsWithSales
        });
    } catch (error) {
        res.status(500).json(error);
    }
}


//[GET] api/products/getTopSold
module.exports.getTopSold = async (req, res) => {
    try {
        const products = await Product.find({ deleted: false }).sort({ numSold: -1 }).limit(8);
        res.status(200).json({ products });
    } catch (error) {
        res.status(500).json(error);
    }
}


module.exports.updateImage = async (req, res) => {
    try {
        const { id } = req.params;
        let { image } = req.body;

        if (!image) {
            return res.status(400).json({ message: 'Image is required!' });
        }

        // Kiểm tra xem chuỗi đã có tiền tố chưa
        if (!image.startsWith('data:image/')) {
            return res.status(400).json({ message: 'Invalid image format! Missing Base64 prefix.' });
        }

        // Xác thực người dùng
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Token is missing or invalid!' });
        }
        const productManager = await User.findOne({ token: token });
        if (!productManager || productManager.role !== 'productManager') {
            return res.status(401).json({ message: 'User not authorized to update product image!' });
        }

        // Cập nhật ảnh sản phẩm
        const product = await Product.findByIdAndUpdate(id, { image: image }, { new: true });
        if (!product) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        res.status(200).json({ message: 'Product image updated successfully.', product });
    } catch (error) {
        console.error("❌ Lỗi trong updateImage:", error);
        res.status(500).json({ error: error.message + ': update product image error' });
    }
};

module.exports.compareProducts = async (req, res) => {
    try {
        const { productId1, productId2 } = req.body;

        const product1 = await Product.findById(productId1);
        const product2 = await Product.findById(productId2);
        
        if (!product1 || !product2) {
            return res.status(404).json({ message: 'One or both products not found' });
        }
        const betterProduct = {
            price: product1.price < product2.price ? 'product1' : 'product2',
            quantity: product1.quantity > product2.quantity ? 'product1' : 'product2',
            sold: product1.sold > product2.sold ? 'product1' : 'product2',
            rating: product1.rating > product2.rating ? 'product1' : 'product2',
            image: product1.image && product2.image ? 'both' : product1.image ? 'product1' : 'product2'
        };
        const priceDiff = Math.abs(((product1.price - product2.price) / Math.max(product1.price, product2.price)) * 100);
        const quantityDiff = Math.abs(((product1.quantity - product2.quantity) / Math.max(product1.quantity, product2.quantity)) * 100);
        const soldDiff = Math.abs(((product1.sold - product2.sold) / Math.max(product1.sold, product2.sold)) * 100);
        const ratingDiff = Math.abs(((product1.rating - product2.rating) / Math.max(product1.rating, product2.rating)) * 100);

        const result = {
            product1: {
                _id: product1._id,
                name: product1.name,
                price: product1.price,
                quantity: product1.quantity,
                sold: product1.sold,
                rating: product1.rating,
                image: product1.image,
                description: product1.description,
                numReviews: product1.numReviews
            },
            product2: {
                _id: product2._id,
                name: product2.name,
                price: product2.price,
                quantity: product2.quantity,
                sold: product2.sold,
                rating: product2.rating,
                image: product2.image,
                description: product2.description,
                numReviews: product2.numReviews
            },
            betterProduct,
            differences: {
                price: {
                    difference: priceDiff.toFixed(2),
                    better: betterProduct.price
                },
                quantity: {
                    difference: quantityDiff.toFixed(2),
                    better: betterProduct.quantity
                },
                sold: {
                    difference: soldDiff.toFixed(2),
                    better: betterProduct.sold
                },
                rating: {
                    difference: ratingDiff.toFixed(2),
                    better: betterProduct.rating
                }
            }
        };

        return res.status(200).json({
            message: 'Comparison successful',
            result
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error', error: err.message });
    }
};


