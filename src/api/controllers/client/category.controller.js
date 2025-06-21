const Category = require('../../models/category')
const PaginationHelper = require('../../../helper/pagination')
const User = require('../../models/user')
const subCategories = require('../../models/subCategory');
const subCategory = require('../../models/subCategory');

//[GET] api/category/getAllCategory
module.exports.getAllCategory = async (req, res) => {
    try {
        const totalCategory = await Category.countDocuments({ deleted: false });

        if (totalCategory === 0) {
            return res.status(404).json({ message: 'No categories found.' });
        }

        const paginationData = await PaginationHelper(
            {
                currentPage: 1,
                limit: 12,
            },
            totalCategory,
            req.query
        );

        // Truy vấn các Category
        const categories = await Category.find({ deleted: false })
            .skip(paginationData.skip)
            .limit(paginationData.limit)
            .sort({ createdAt: 'desc' });

        // Truy vấn các SubCategory liên quan đến mỗi Category
        const categoryWithSubCategories = await Promise.all(
            categories.map(async (category) => {
                // Lấy tất cả SubCategory có `category` là `_id` của category hiện tại
                const subCategories = await subCategory.find({ category: category._id });

                // Trả về category cùng với subCategories
                return {
                    ...category.toObject(),
                    subCategories: subCategories.map(subCategory => ({
                        id: subCategory._id,
                        name: subCategory.name,
                        description: subCategory.description,
                        image: subCategory.image,
                        status: subCategory.status,
                    })),
                };
            })
        );
        return res.status(200).json({
            categories: categoryWithSubCategories,
            totalPage: paginationData.totalPage,
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        return res.status(500).json({ message: 'Server error.', error: error.message });
    }
};


//[GET] api/category/getCategory
module.exports.getCategory = async (req, res) => {
    try {
        const category = await Category.findById();
        res.status(200).json({ category });
    } catch (error) {
        res.status(500).json({ error: error.message + ': get category error' });
    }
}

//[GET] api/category/getSubCategory/:id
module.exports.getSubCategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        const subCategory = await subCategories.findById(id);
        res.status(200).json({ subCategory });
    } catch (error) {
        res.status(500).json({ error: error.message + ': get category error' });
    }
}


//[POST] api/category/addCategory
module.exports.addCategory = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Token is missing or invalid!' });
        }

        const productManager = await User.findOne({ token: token });

        if (!productManager || productManager.role !== 'productManager') {
            return res.status(401).json({ message: 'User not authorized to add product or User not found!!!' });
        }
        const { name, description, image } = req.body;

        const checkCategory = await Category.findOne({ name: name })
        if (checkCategory) return res.status(400).json({ message: 'Category already exists' })
        const category = new Category({ name, description, image, productManager: productManager._id });
        await category.save();
        res.status(200).json({ message: 'Category added successfully', category });

    } catch (error) {
        res.status(500).json({ error: error.message + ': add category error' });
    }
}



//[PUT] api/category/updateCategory/:id
module.exports.updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, image } = req.body;
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Token is missing or invalid!' });
        }

        const productManager = await User.findOne({ token: token });
        if (!productManager || productManager.role !== 'productManager') {
            return res.status(401).json({ message: 'User not authorized to update category or User not found!!!' });
        }
        const category = await Category.findByIdAndUpdate(id, { name, description, image }, { new: true });
        if (!category) {
            return res.status(404).json({ message: 'Category not found.' });
        }
        res.status(200).json({ message: 'Category updated successfully', category });
    } catch (error) {
        res.status(500).json({ error: error.message + ': update category error' });
    }
}

//[DELETE] api/category/managerDeleteCategory/:id
module.exports.managerDeleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Token is missing or invalid!' });
        }

        const productManager = await User.findOne({ token });
        if (!productManager || productManager.role !== 'productManager') {
            return res.status(403).json({ message: 'User not authorized to delete category or User not found!' });
        }

        const deletedCategory = await Category.findOneAndDelete(
            { _id: id, deleted: false },
            { deleted: true },
            { new: true }
        );

        if (!deletedCategory) {
            console.error('Category deletion failed:', deletedCategory);
            return res.status(404).json({ message: 'Category not found.' });
        }

        return res.status(200).json({
            message: 'Category deleted successfully.',
            category: deletedCategory,
        });
    } catch (error) {
        console.error('Error deleting category:', error);
        return res.status(500).json({
            error: `${error.message}: delete category error`,
            stack: error.stack,
        });
    }
};

//[DELETE] api/category/adminDeleteCategory/:id

module.exports.adminDeleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const deleteCategory = await Category.findByIdAndDelete(id);
        if (!deleteCategory) {
            return res.status(404).json({ message: 'Category not found.' });
        }
        res.status(200).json({ message: 'Category deleted successfully', category });
    } catch (error) {
        res.status(500).json({ error: error.message + ': delete category error' });
    }
}



//[POST] api/category/addSubCategory
module.exports.addSubCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await Category.findById(id);
        if (!category) return res.status(400).json({ message: 'Category not found' })

        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Token is missing or invalid!' });
        }

        const productManager = await User.findOne({ token: token });

        if (!productManager || productManager.role !== 'productManager') {
            return res.status(401).json({ message: 'User not authorized to add subCategory or User not found!!!' });
        }


        const { name, description, image } = req.body;

        const checkSubCategori = await subCategories.findOne({ name: name })
        if (checkSubCategori) return res.status(400).json({ message: 'SubCategory already exists' })

        const subCategory = new subCategories({ name, description, image, category: id });
        await subCategory.save();
        res.status(200).json({ message: 'SubCategory added successfully', subCategory });
    } catch (error) {
        res.status(500).json({ error: error.message + ': add subCategory error' });
    }
}


//[PUT] api/category/updateSubCategory/:id
module.exports.updateSubCategory = async (req, res) => {
    try {
        const { id } = req.params;

        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Token is missing or invalid!' });
        }

        const productManager = await User.findOne({ token: token });

        if (!productManager || productManager.role !== 'productManager') {
            return res.status(401).json({ message: 'User not authorized to add subCategory or User not found!!!' });
        }

        const { name, description, image } = req.body;
        const subCategory = await subCategories.findByIdAndUpdate(id, { name, description, image }, { new: true });
        if (!subCategory) {
            return res.status(404).json({ message: 'SubCategory not found.' });
        }
        res.status(200).json({ message: 'SubCategory updated successfully', subCategory });
    } catch (error) {
        res.status(500).json({ error: error.message + ': update subCategory error' });
    }
}


//[DELETE] api/category/managerDeleteSubCategory/:id
module.exports.managerDeleteSubCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Token is missing or invalid!' });
        }

        const productManager = await User.findOne({ token });
        if (!productManager || productManager.role !== 'productManager') {
            return res.status(403).json({ message: 'User not authorized to delete subCategory or User not found!' });
        }

        const deletedSubCategory = await subCategories.findByIdAndDelete({ _id: id, required: false });


        if (!deletedSubCategory) {
            console.error('SubCategory deletion failed:', deletedSubCategory);
            return res.status(404).json({ message: 'SubCategory not found.' });
        }

        return res.status(200).json({
            message: 'SubCategory deleted successfully.',
            subCategory: deletedSubCategory,
        });
    } catch (error) {
        console.error('Error deleting subCategory:', error);
        return res.status(500).json({
            error: `${error.message}: delete subCategory error`,
            stack: error.stack,
        });
    }
};

module.exports.getAllSubCategoriesByCategory = async (req, res) => {
    try {
      const { categoryId } = req.params;
      const subCategories = await SubCategory.find({ categoryId });
  
      res.status(200).json({ success: true, subCategories });
    } catch (error) {
      res.status(500).json({ success: false, message: "Lỗi khi tải subcategories" });
    }
  };
