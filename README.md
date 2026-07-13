# WHU Practical Tool Development

## 武汉大学专业发展系统课程成绩导出

### 📖 简介
本脚本用于**武汉大学期末课程成绩查询**
当任课教师已上传成绩，但学院教秘尚未审核发布至教务系统或可信电子凭证时，可借助本工具提前查看自己的期末课程分数
> ⚠️ 受系统限制，目前仅能查看分数段

### ✨ 功能
- 在[专业发展系统](http://zyfzzd.whu.edu.cn/)的「学生画像 → 学业情况」页面自动收集成绩数据
- 自动识别所有学期，按学期和课程性质排序，一键导出为 HTML 成绩单

### 🛠 开发工具
本项目由 ChatGPT-5.6 Terra开发

### 📥 安装与使用
1. 在浏览器中安装 [Tampermonkey](https://www.tampermonkey.net/) 扩展
2. 安装本脚本：[whu-grade-export.user.js](tampermonkey/whu-grade-export.user.js)
3. 打开 [武汉大学专业发展系统](http://zyfzzd.whu.edu.cn/)，进入 **学生画像 → 学业情况** 页面
4. 刷新页面，右下角会出现 **“导出成绩”** 按钮
5. 点击按钮，选择保存位置即可导出 HTML 成绩单

### 📄 脚本说明
- 类型：Tampermonkey 用户脚本
- 功能：爬取当前课程成绩信息，生成格式化的成绩单并导出
