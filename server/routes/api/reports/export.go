package reports

import (
	"encoding/csv"
	"fmt"
	"net/http"
	"os"
	"time"

	"asset-management-system/server/global"
	"asset-management-system/server/models"
	"asset-management-system/server/pkg/utils"

	"github.com/gin-gonic/gin"
	"github.com/xuri/excelize/v2"
)

// exportAssetReportsToExcelFile 导出资产报表到Excel文件
func exportAssetReportsToExcelFile(c *gin.Context, parameters map[string]interface{}) {
	// 从parameters中获取筛选条件
	startDate := ""
	endDate := ""
	categoryID := ""
	departmentID := ""
	status := ""
	if parameters != nil {
		if sd, ok := parameters["start_date"].(string); ok {
			startDate = sd
		}
		if ed, ok := parameters["end_date"].(string); ok {
			endDate = ed
		}
		if cid, ok := parameters["category_id"].(string); ok {
			categoryID = cid
		}
		if did, ok := parameters["department_id"].(string); ok {
			departmentID = did
		}
		if st, ok := parameters["status"].(string); ok {
			status = st
		}
	}

	// 构建查询获取资产数据
	query := global.DB.Model(&models.Asset{}).
		Preload("Category").
		Preload("Department")

	// 应用筛选条件
	if startDate != "" {
		if start, err := time.Parse("2006-01-02", startDate); err == nil {
			query = query.Where("created_at >= ?", start)
		}
	}
	if endDate != "" {
		if end, err := time.Parse("2006-01-02", endDate); err == nil {
			query = query.Where("created_at <= ?", end.Add(24*time.Hour))
		}
	}
	if categoryID != "" {
		query = query.Where("category_id = ?", categoryID)
	}
	if departmentID != "" {
		query = query.Where("department_id = ?", departmentID)
	}
	if status != "" {
		query = query.Where("status = ?", status)
	}

	// 获取所有资产数据
	var assets []models.Asset
	if err := query.Find(&assets).Error; err != nil {
		utils.InternalError(c, fmt.Errorf("查询资产数据失败: %v", err))
		return
	}

	// 如果没有数据，返回错误
	if len(assets) == 0 {
		utils.Error(c, utils.ASSET_NOT_FOUND, "没有找到符合条件的资产数据")
		return
	}

	f := excelize.NewFile()
	defer func() {
		if err := f.Close(); err != nil {
			fmt.Println(err)
		}
	}()

	// 创建工作表
	sheetName := "资产统计报表"
	index, err := f.NewSheet(sheetName)
	if err != nil {
		utils.InternalError(c, fmt.Errorf("创建工作表失败: %v", err))
		return
	}

	// 设置表头
	headers := []string{"资产编号", "资产名称", "分类", "部门", "状态", "采购价格", "采购日期", "位置", "责任人", "保修期(月)", "供应商"}
	for i, header := range headers {
		cell := fmt.Sprintf("%c1", 'A'+i)
		f.SetCellValue(sheetName, cell, header)
	}

	// 设置表头样式
	headerStyle, _ := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{Bold: true},
		Fill: excelize.Fill{Type: "pattern", Color: []string{"#E0E0E0"}, Pattern: 1},
	})
	f.SetCellStyle(sheetName, "A1", fmt.Sprintf("%c1", 'A'+len(headers)-1), headerStyle)

	// 填充数据
	for i, asset := range assets {
		// 资产编号
		f.SetCellValue(sheetName, fmt.Sprintf("A%d", i+2), asset.AssetNo)

		// 资产名称
		f.SetCellValue(sheetName, fmt.Sprintf("B%d", i+2), asset.Name)

		// 分类名称
		categoryName := ""
		if asset.Category.ID > 0 {
			categoryName = asset.Category.Name
		}
		f.SetCellValue(sheetName, fmt.Sprintf("C%d", i+2), categoryName)

		// 部门名称
		departmentName := ""
		if asset.Department != nil {
			departmentName = asset.Department.Name
		}
		f.SetCellValue(sheetName, fmt.Sprintf("D%d", i+2), departmentName)

		// 状态（转换为中文显示）
		statusDisplay := string(asset.Status)
		switch asset.Status {
		case "available":
			statusDisplay = "可用"
		case "borrowed":
			statusDisplay = "借用中"
		case "maintenance":
			statusDisplay = "维护中"
		case "scrapped":
			statusDisplay = "已报废"
		}
		f.SetCellValue(sheetName, fmt.Sprintf("E%d", i+2), statusDisplay)

		// 采购价格
		f.SetCellValue(sheetName, fmt.Sprintf("F%d", i+2), asset.PurchasePrice)

		// 采购日期
		purchaseDateStr := ""
		if asset.PurchaseDate != nil {
			purchaseDateStr = asset.PurchaseDate.Format("2006-01-02")
		}
		f.SetCellValue(sheetName, fmt.Sprintf("G%d", i+2), purchaseDateStr)

		// 位置
		f.SetCellValue(sheetName, fmt.Sprintf("H%d", i+2), asset.Location)

		// 责任人
		f.SetCellValue(sheetName, fmt.Sprintf("I%d", i+2), asset.ResponsiblePerson)

		// 保修期
		f.SetCellValue(sheetName, fmt.Sprintf("J%d", i+2), asset.WarrantyPeriod)

		// 供应商
		f.SetCellValue(sheetName, fmt.Sprintf("K%d", i+2), asset.Supplier)
	}

	// 设置列宽
	colWidths := []float64{15, 20, 15, 15, 10, 12, 12, 20, 12, 12, 20}
	for i, width := range colWidths {
		col := fmt.Sprintf("%c:%c", 'A'+i, 'A'+i)
		f.SetColWidth(sheetName, col, col, width)
	}

	// 设置活动工作表
	f.SetActiveSheet(index)

	// 生成唯一文件名
	timestamp := time.Now().Format("20060102_150405")
	randomStr := fmt.Sprintf("%06d", time.Now().Nanosecond()%1000000)
	filename := fmt.Sprintf("asset_report_%s_%s.xlsx", timestamp, randomStr)

	// 确保导出目录存在
	exportDir := "./uploads/exports"
	if err := os.MkdirAll(exportDir, 0755); err != nil {
		utils.InternalError(c, fmt.Errorf("创建导出目录失败: %v", err))
		return
	}

	// 保存文件到文件系统
	filepath := fmt.Sprintf("%s/%s", exportDir, filename)
	if err := f.SaveAs(filepath); err != nil {
		utils.InternalError(c, fmt.Errorf("保存报表文件失败: %v", err))
		return
	}

	// 获取文件大小
	if fileInfo, err := os.Stat(filepath); err == nil {
		fileSize := fileInfo.Size()
		// 异步记录报表生成
		go func() {
			recordReportGeneration("资产统计报表", models.ReportRecordTypeAsset, models.ReportRecordFormatExcel, filename, &fileSize, "系统用户", parameters)
		}()
	}

	// 返回下载URL
	downloadURL := utils.GetFileURL(c.GetString("base_url"), fmt.Sprintf("/api/assets/download/%s", filename))
	response := gin.H{
		"download_url": downloadURL,
		"filename":     filename,
		"message":      "资产报表已生成",
	}

	utils.Success(c, response)
}

// exportAssetReportsToCSVFile 导出资产报表到CSV文件
func exportAssetReportsToCSVFile(c *gin.Context, parameters map[string]interface{}) {
	// 生成唯一文件名
	timestamp := time.Now().Format("20060102_150405")
	randomStr := fmt.Sprintf("%06d", time.Now().Nanosecond()%1000000)
	filename := fmt.Sprintf("asset_report_%s_%s.csv", timestamp, randomStr)

	// 确保导出目录存在
	exportDir := "./uploads/exports"
	if err := os.MkdirAll(exportDir, 0755); err != nil {
		utils.InternalError(c, fmt.Errorf("创建导出目录失败: %v", err))
		return
	}

	// 创建CSV文件
	filepath := fmt.Sprintf("%s/%s", exportDir, filename)
	file, err := os.Create(filepath)
	if err != nil {
		utils.InternalError(c, fmt.Errorf("创建CSV文件失败: %v", err))
		return
	}
	defer file.Close()

	// 创建CSV写入器
	writer := csv.NewWriter(file)
	defer writer.Flush()

	// 从parameters中获取筛选条件
	startDate := ""
	endDate := ""
	categoryID := ""
	departmentID := ""
	status := ""
	if parameters != nil {
		if sd, ok := parameters["start_date"].(string); ok {
			startDate = sd
		}
		if ed, ok := parameters["end_date"].(string); ok {
			endDate = ed
		}
		if cid, ok := parameters["category_id"].(string); ok {
			categoryID = cid
		}
		if did, ok := parameters["department_id"].(string); ok {
			departmentID = did
		}
		if st, ok := parameters["status"].(string); ok {
			status = st
		}
	}

	// 构建查询获取资产数据
	query := global.DB.Model(&models.Asset{}).
		Preload("Category").
		Preload("Department")

	// 应用筛选条件
	if startDate != "" {
		if start, err := time.Parse("2006-01-02", startDate); err == nil {
			query = query.Where("created_at >= ?", start)
		}
	}
	if endDate != "" {
		if end, err := time.Parse("2006-01-02", endDate); err == nil {
			query = query.Where("created_at <= ?", end.Add(24*time.Hour))
		}
	}
	if categoryID != "" {
		query = query.Where("category_id = ?", categoryID)
	}
	if departmentID != "" {
		query = query.Where("department_id = ?", departmentID)
	}
	if status != "" {
		query = query.Where("status = ?", status)
	}

	// 获取所有资产数据
	var assets []models.Asset
	if err := query.Find(&assets).Error; err != nil {
		utils.InternalError(c, fmt.Errorf("查询资产数据失败: %v", err))
		return
	}

	// 如果没有数据，返回错误
	if len(assets) == 0 {
		utils.Error(c, utils.ASSET_NOT_FOUND, "没有找到符合条件的资产数据")
		return
	}

	// 写入表头
	headers := []string{"资产编号", "资产名称", "分类", "部门", "状态", "采购价格", "采购日期", "位置", "责任人", "保修期(月)", "供应商"}
	if err := writer.Write(headers); err != nil {
		utils.InternalError(c, fmt.Errorf("写入CSV表头失败: %v", err))
		return
	}

	// 写入数据
	for _, asset := range assets {
		// 资产编号
		assetNo := asset.AssetNo

		// 资产名称
		name := asset.Name

		// 分类名称
		categoryName := ""
		if asset.Category.ID > 0 {
			categoryName = asset.Category.Name
		}

		// 部门名称
		departmentName := ""
		if asset.Department != nil {
			departmentName = asset.Department.Name
		}

		// 状态（转换为中文显示）
		statusDisplay := string(asset.Status)
		switch asset.Status {
		case "available":
			statusDisplay = "可用"
		case "borrowed":
			statusDisplay = "借用中"
		case "maintenance":
			statusDisplay = "维护中"
		case "scrapped":
			statusDisplay = "已报废"
		}

		// 采购价格
		purchasePrice := ""
		if asset.PurchasePrice != nil {
			purchasePrice = fmt.Sprintf("%.2f", *asset.PurchasePrice)
		}

		// 采购日期
		purchaseDateStr := ""
		if asset.PurchaseDate != nil {
			purchaseDateStr = asset.PurchaseDate.Format("2006-01-02")
		}

		// 位置
		location := asset.Location

		// 责任人
		responsiblePerson := asset.ResponsiblePerson

		// 保修期
		warrantyPeriod := ""
		if asset.WarrantyPeriod != nil {
			warrantyPeriod = fmt.Sprintf("%d", *asset.WarrantyPeriod)
		}

		// 供应商
		supplier := asset.Supplier

		// 写入CSV行
		row := []string{
			assetNo, name, categoryName, departmentName, statusDisplay,
			purchasePrice, purchaseDateStr, location, responsiblePerson,
			warrantyPeriod, supplier,
		}

		if err := writer.Write(row); err != nil {
			utils.InternalError(c, fmt.Errorf("写入CSV数据失败: %v", err))
			return
		}
	}

	// 获取文件大小
	if fileInfo, err := os.Stat(filepath); err == nil {
		fileSize := fileInfo.Size()
		// 异步记录报表生成
		go func() {
			recordReportGeneration("资产统计报表", models.ReportRecordTypeAsset, models.ReportRecordFormatCSV, filename, &fileSize, "系统用户", parameters)
		}()
	}

	// 返回下载URL
	downloadURL := utils.GetFileURL(c.GetString("base_url"), fmt.Sprintf("/api/assets/download/%s", filename))
	response := gin.H{
		"download_url": downloadURL,
		"filename":     filename,
		"message":      "资产报表已生成",
	}

	utils.Success(c, response)
}

// exportBorrowReportsToExcelFile 导出借用报表到Excel文件
func exportBorrowReportsToExcelFile(c *gin.Context, parameters map[string]interface{}) {
	f := excelize.NewFile()
	defer f.Close()

	sheetName := "借用统计报表"
	index, err := f.NewSheet(sheetName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    "EXPORT_ERROR",
			"message": "创建工作表失败",
			"data":    err.Error(),
		})
		return
	}

	// 设置表头
	headers := []string{"借用编号", "资产编号", "资产名称", "借用人", "借用日期", "预计归还日期", "实际归还日期", "状态"}
	for i, header := range headers {
		cell := fmt.Sprintf("%c1", 'A'+i)
		f.SetCellValue(sheetName, cell, header)
	}

	// 设置表头样式
	headerStyle, _ := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{Bold: true},
		Fill: excelize.Fill{Type: "pattern", Color: []string{"#E0E0E0"}, Pattern: 1},
	})
	f.SetCellStyle(sheetName, "A1", fmt.Sprintf("%c1", 'A'+len(headers)-1), headerStyle)

	// 从parameters中获取筛选条件
	startDate := ""
	endDate := ""
	departmentID := ""
	status := ""
	borrowerName := ""
	if parameters != nil {
		if sd, ok := parameters["start_date"].(string); ok {
			startDate = sd
		}
		if ed, ok := parameters["end_date"].(string); ok {
			endDate = ed
		}
		if did, ok := parameters["department_id"].(string); ok {
			departmentID = did
		}
		if st, ok := parameters["status"].(string); ok {
			status = st
		}
		if bn, ok := parameters["borrower_name"].(string); ok {
			borrowerName = bn
		}
	}

	// 构建查询获取借用记录数据
	query := global.DB.Model(&models.BorrowRecord{}).
		Preload("Asset").
		Preload("Department")

	// 应用筛选条件
	if startDate != "" {
		if start, err := time.Parse("2006-01-02", startDate); err == nil {
			query = query.Where("borrow_date >= ?", start)
		}
	}
	if endDate != "" {
		if end, err := time.Parse("2006-01-02", endDate); err == nil {
			query = query.Where("borrow_date <= ?", end.Add(24*time.Hour))
		}
	}
	if departmentID != "" {
		query = query.Where("department_id = ?", departmentID)
	}
	if status != "" {
		query = query.Where("status = ?", status)
	}
	if borrowerName != "" {
		query = query.Where("borrower_name LIKE ?", "%"+borrowerName+"%")
	}

	// 获取所有借用记录数据
	var borrowRecords []models.BorrowRecord
	if err := query.Order("borrow_date DESC").Find(&borrowRecords).Error; err != nil {
		utils.InternalError(c, fmt.Errorf("查询借用记录失败: %v", err))
		return
	}

	// 如果没有数据，返回错误
	if len(borrowRecords) == 0 {
		utils.Error(c, utils.ASSET_NOT_FOUND, "没有找到符合条件的借用记录")
		return
	}

	// 更新表头，添加借用部门字段
	headers = []string{"借用编号", "资产编号", "资产名称", "借用人", "借用日期", "预计归还日期", "实际归还日期", "状态", "借用部门"}
	for i, header := range headers {
		cell := fmt.Sprintf("%c1", 'A'+i)
		f.SetCellValue(sheetName, cell, header)
	}
	f.SetCellStyle(sheetName, "A1", fmt.Sprintf("%c1", 'A'+len(headers)-1), headerStyle)

	// 填充数据
	for i, record := range borrowRecords {
		// 借用编号
		f.SetCellValue(sheetName, fmt.Sprintf("A%d", i+2), record.ID)

		// 资产编号和名称
		assetNo := ""
		assetName := ""
		if record.Asset.ID > 0 {
			assetNo = record.Asset.AssetNo
			assetName = record.Asset.Name
		}
		f.SetCellValue(sheetName, fmt.Sprintf("B%d", i+2), assetNo)
		f.SetCellValue(sheetName, fmt.Sprintf("C%d", i+2), assetName)

		// 借用人
		f.SetCellValue(sheetName, fmt.Sprintf("D%d", i+2), record.BorrowerName)

		// 借用日期
		f.SetCellValue(sheetName, fmt.Sprintf("E%d", i+2), record.BorrowDate.Format("2006-01-02"))

		// 预计归还日期
		expectedReturnDateStr := ""
		if record.ExpectedReturnDate != nil {
			expectedReturnDateStr = record.ExpectedReturnDate.Format("2006-01-02")
		}
		f.SetCellValue(sheetName, fmt.Sprintf("F%d", i+2), expectedReturnDateStr)

		// 实际归还日期
		actualReturnDateStr := ""
		if record.ActualReturnDate != nil {
			actualReturnDateStr = record.ActualReturnDate.Format("2006-01-02")
		}
		f.SetCellValue(sheetName, fmt.Sprintf("G%d", i+2), actualReturnDateStr)

		// 状态（转换为中文显示）
		statusDisplay := string(record.Status)
		switch record.Status {
		case "borrowed":
			statusDisplay = "借用中"
		case "returned":
			statusDisplay = "已归还"
		case "overdue":
			statusDisplay = "逾期"
		}
		f.SetCellValue(sheetName, fmt.Sprintf("H%d", i+2), statusDisplay)

		// 借用部门
		departmentName := ""
		if record.Department != nil {
			departmentName = record.Department.Name
		}
		f.SetCellValue(sheetName, fmt.Sprintf("I%d", i+2), departmentName)
	}

	// 设置列宽
	colWidths := []float64{12, 15, 20, 12, 12, 15, 15, 10, 15}
	for i, width := range colWidths {
		col := fmt.Sprintf("%c:%c", 'A'+i, 'A'+i)
		f.SetColWidth(sheetName, col, col, width)
	}

	f.SetActiveSheet(index)

	// 生成唯一文件名
	timestamp := time.Now().Format("20060102_150405")
	randomStr := fmt.Sprintf("%06d", time.Now().Nanosecond()%1000000)
	filename := fmt.Sprintf("borrow_report_%s_%s.xlsx", timestamp, randomStr)

	// 确保导出目录存在
	exportDir := "./uploads/exports"
	if err := os.MkdirAll(exportDir, 0755); err != nil {
		utils.InternalError(c, fmt.Errorf("创建导出目录失败: %v", err))
		return
	}

	// 保存文件到文件系统
	filepath := fmt.Sprintf("%s/%s", exportDir, filename)
	if err := f.SaveAs(filepath); err != nil {
		utils.InternalError(c, fmt.Errorf("保存报表文件失败: %v", err))
		return
	}

	// 获取文件大小
	if fileInfo, err := os.Stat(filepath); err == nil {
		fileSize := fileInfo.Size()
		// 异步记录报表生成
		go func() {
			recordReportGeneration("借用统计报表", models.ReportRecordTypeBorrow, models.ReportRecordFormatExcel, filename, &fileSize, "系统用户", parameters)
		}()
	}

	// 返回下载URL
	downloadURL := utils.GetFileURL(c.GetString("base_url"), fmt.Sprintf("/api/assets/download/%s", filename))
	response := gin.H{
		"download_url": downloadURL,
		"filename":     filename,
		"message":      "借用报表已生成",
	}

	utils.Success(c, response)
}

// exportBorrowReportsToCSVFile 导出借用报表到CSV文件
func exportBorrowReportsToCSVFile(c *gin.Context, parameters map[string]interface{}) {
	// 从parameters中获取筛选条件
	startDate := ""
	endDate := ""
	departmentID := ""
	status := ""
	borrowerName := ""
	if parameters != nil {
		if sd, ok := parameters["start_date"].(string); ok {
			startDate = sd
		}
		if ed, ok := parameters["end_date"].(string); ok {
			endDate = ed
		}
		if did, ok := parameters["department_id"].(string); ok {
			departmentID = did
		}
		if st, ok := parameters["status"].(string); ok {
			status = st
		}
		if bn, ok := parameters["borrower_name"].(string); ok {
			borrowerName = bn
		}
	}

	// 构建查询获取借用记录数据
	query := global.DB.Model(&models.BorrowRecord{}).
		Preload("Asset").
		Preload("Department")

	// 应用筛选条件
	if startDate != "" {
		if start, err := time.Parse("2006-01-02", startDate); err == nil {
			query = query.Where("borrow_date >= ?", start)
		}
	}
	if endDate != "" {
		if end, err := time.Parse("2006-01-02", endDate); err == nil {
			query = query.Where("borrow_date <= ?", end.Add(24*time.Hour))
		}
	}
	if departmentID != "" {
		query = query.Where("department_id = ?", departmentID)
	}
	if status != "" {
		query = query.Where("status = ?", status)
	}
	if borrowerName != "" {
		query = query.Where("borrower_name LIKE ?", "%"+borrowerName+"%")
	}

	// 获取所有借用记录数据
	var borrowRecords []models.BorrowRecord
	if err := query.Order("borrow_date DESC").Find(&borrowRecords).Error; err != nil {
		utils.InternalError(c, fmt.Errorf("查询借用记录失败: %v", err))
		return
	}

	// 如果没有数据，返回错误
	if len(borrowRecords) == 0 {
		utils.Error(c, utils.ASSET_NOT_FOUND, "没有找到符合条件的借用记录")
		return
	}

	// 生成唯一文件名
	timestamp := time.Now().Format("20060102_150405")
	randomStr := fmt.Sprintf("%06d", time.Now().Nanosecond()%1000000)
	filename := fmt.Sprintf("borrow_report_%s_%s.csv", timestamp, randomStr)

	// 确保导出目录存在
	exportDir := "./uploads/exports"
	if err := os.MkdirAll(exportDir, 0755); err != nil {
		utils.InternalError(c, fmt.Errorf("创建导出目录失败: %v", err))
		return
	}

	// 创建CSV文件
	filepath := fmt.Sprintf("%s/%s", exportDir, filename)
	file, err := os.Create(filepath)
	if err != nil {
		utils.InternalError(c, fmt.Errorf("创建CSV文件失败: %v", err))
		return
	}
	defer file.Close()

	writer := csv.NewWriter(file)
	defer writer.Flush()

	// 写入表头
	headers := []string{"借用编号", "资产编号", "资产名称", "借用人", "借用日期", "预计归还日期", "实际归还日期", "状态", "借用部门"}
	if err := writer.Write(headers); err != nil {
		utils.InternalError(c, fmt.Errorf("写入CSV表头失败: %v", err))
		return
	}

	// 写入数据
	for _, record := range borrowRecords {
		// 借用编号
		borrowID := fmt.Sprintf("%d", record.ID)

		// 资产编号和名称
		assetNo := ""
		assetName := ""
		if record.Asset.ID > 0 {
			assetNo = record.Asset.AssetNo
			assetName = record.Asset.Name
		}

		// 借用人
		borrowerName := record.BorrowerName

		// 借用日期
		borrowDate := record.BorrowDate.Format("2006-01-02")

		// 预计归还日期
		expectedReturnDateStr := ""
		if record.ExpectedReturnDate != nil {
			expectedReturnDateStr = record.ExpectedReturnDate.Format("2006-01-02")
		}

		// 实际归还日期
		actualReturnDateStr := ""
		if record.ActualReturnDate != nil {
			actualReturnDateStr = record.ActualReturnDate.Format("2006-01-02")
		}

		// 状态（转换为中文显示）
		statusDisplay := string(record.Status)
		switch record.Status {
		case "borrowed":
			statusDisplay = "借用中"
		case "returned":
			statusDisplay = "已归还"
		case "overdue":
			statusDisplay = "逾期"
		}

		// 借用部门
		departmentName := ""
		if record.Department != nil {
			departmentName = record.Department.Name
		}

		// 写入CSV行
		row := []string{
			borrowID, assetNo, assetName, borrowerName, borrowDate,
			expectedReturnDateStr, actualReturnDateStr, statusDisplay, departmentName,
		}

		if err := writer.Write(row); err != nil {
			utils.InternalError(c, fmt.Errorf("写入CSV数据失败: %v", err))
			return
		}
	}

	// 获取文件大小
	if fileInfo, err := os.Stat(filepath); err == nil {
		fileSize := fileInfo.Size()
		// 异步记录报表生成
		go func() {
			recordReportGeneration("借用统计报表", models.ReportRecordTypeBorrow, models.ReportRecordFormatCSV, filename, &fileSize, "系统用户", parameters)
		}()
	}

	// 返回下载URL
	downloadURL := utils.GetFileURL(c.GetString("base_url"), fmt.Sprintf("/api/assets/download/%s", filename))
	response := gin.H{
		"download_url": downloadURL,
		"filename":     filename,
		"message":      "借用报表已生成",
	}

	utils.Success(c, response)
}

// exportInventoryReportsToExcelFile 导出盘点报表到Excel文件
func exportInventoryReportsToExcelFile(c *gin.Context, parameters map[string]interface{}) {
	f := excelize.NewFile()
	defer f.Close()

	// 从parameters中获取筛选条件
	startDate := ""
	endDate := ""
	taskType := ""
	status := ""
	categoryID := ""
	departmentID := ""
	if parameters != nil {
		if sd, ok := parameters["start_date"].(string); ok {
			startDate = sd
		}
		if ed, ok := parameters["end_date"].(string); ok {
			endDate = ed
		}
		if tt, ok := parameters["task_type"].(string); ok {
			taskType = tt
		}
		if st, ok := parameters["status"].(string); ok {
			status = st
		}
		if cid, ok := parameters["category_id"].(string); ok {
			categoryID = cid
		}
		if did, ok := parameters["department_id"].(string); ok {
			departmentID = did
		}
	}

	// 构建查询条件
	query := global.DB.Model(&models.InventoryTask{})

	if startDate != "" {
		if start, err := time.Parse("2006-01-02", startDate); err == nil {
			query = query.Where("created_at >= ?", start)
		}
	}

	if endDate != "" {
		if end, err := time.Parse("2006-01-02", endDate); err == nil {
			query = query.Where("created_at <= ?", end.Add(24*time.Hour))
		}
	}

	if taskType != "" {
		query = query.Where("task_type = ?", taskType)
	}

	if status != "" {
		query = query.Where("status = ?", status)
	}

	// 获取盘点任务数据
	var tasks []models.InventoryTask
	if err := query.Find(&tasks).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    "DATABASE_ERROR",
			"message": "查询盘点任务失败",
			"data":    err.Error(),
		})
		return
	}

	// 创建多个工作表
	// 1. 盘点任务概览
	overviewSheet := "盘点任务概览"
	overviewIndex, err := f.NewSheet(overviewSheet)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    "EXPORT_ERROR",
			"message": "创建工作表失败",
			"data":    err.Error(),
		})
		return
	}

	// 设置概览表头
	overviewHeaders := []string{"任务ID", "任务名称", "任务类型", "状态", "开始日期", "结束日期", "总资产数", "已检查数", "正常数", "盘盈数", "盘亏数", "损坏数", "准确率"}
	for i, header := range overviewHeaders {
		cell := fmt.Sprintf("%c1", 'A'+i)
		f.SetCellValue(overviewSheet, cell, header)
	}

	// 设置概览表头样式
	headerStyle, _ := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{Bold: true},
		Fill: excelize.Fill{Type: "pattern", Color: []string{"#E0E0E0"}, Pattern: 1},
	})
	f.SetCellStyle(overviewSheet, "A1", fmt.Sprintf("%c1", 'A'+len(overviewHeaders)-1), headerStyle)

	// 填充概览数据
	rowIndex := 2
	for _, task := range tasks {
		// 获取该任务的盘点记录统计
		var stats struct {
			TotalAssets   int64
			CheckedAssets int64
			NormalCount   int64
			SurplusCount  int64
			DeficitCount  int64
			DamagedCount  int64
		}

		global.DB.Model(&models.InventoryRecord{}).
			Where("task_id = ?", task.ID).
			Select(`
				COUNT(DISTINCT asset_id) as total_assets,
				COUNT(*) as checked_assets,
				SUM(CASE WHEN result = 'normal' THEN 1 ELSE 0 END) as normal_count,
				SUM(CASE WHEN result = 'surplus' THEN 1 ELSE 0 END) as surplus_count,
				SUM(CASE WHEN result = 'deficit' THEN 1 ELSE 0 END) as deficit_count,
				SUM(CASE WHEN result = 'damaged' THEN 1 ELSE 0 END) as damaged_count
			`).
			Scan(&stats)

		// 计算准确率
		accuracyRate := 0.0
		if stats.CheckedAssets > 0 {
			accuracyRate = float64(stats.NormalCount) / float64(stats.CheckedAssets) * 100
		}

		// 任务类型显示
		taskTypeDisplay := task.TaskType
		switch task.TaskType {
		case "full":
			taskTypeDisplay = "全盘"
		case "department":
			taskTypeDisplay = "按部门盘点"
		case "category":
			taskTypeDisplay = "按分类盘点"
		case "spot":
			taskTypeDisplay = "抽查"
		}

		// 状态显示
		statusDisplay := task.Status
		switch task.Status {
		case "pending":
			statusDisplay = "待开始"
		case "in_progress":
			statusDisplay = "进行中"
		case "completed":
			statusDisplay = "已完成"
		}

		// 填充数据
		data := []interface{}{
			task.ID,
			task.TaskName,
			taskTypeDisplay,
			statusDisplay,
			task.StartDate,
			task.EndDate,
			stats.TotalAssets,
			stats.CheckedAssets,
			stats.NormalCount,
			stats.SurplusCount,
			stats.DeficitCount,
			stats.DamagedCount,
			fmt.Sprintf("%.2f%%", accuracyRate),
		}

		for j, value := range data {
			cell := fmt.Sprintf("%c%d", 'A'+j, rowIndex)
			f.SetCellValue(overviewSheet, cell, value)
		}
		rowIndex++
	}

	// 2. 详细盘点记录
	detailSheet := "详细盘点记录"
	_, err = f.NewSheet(detailSheet)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    "EXPORT_ERROR",
			"message": "创建工作表失败",
			"data":    err.Error(),
		})
		return
	}

	// 设置详细记录表头
	detailHeaders := []string{"任务名称", "资产编号", "资产名称", "分类", "部门", "预期状态", "实际状态", "盘点结果", "盘点人", "盘点时间", "备注"}
	for i, header := range detailHeaders {
		cell := fmt.Sprintf("%c1", 'A'+i)
		f.SetCellValue(detailSheet, cell, header)
	}

	// 设置详细记录表头样式
	f.SetCellStyle(detailSheet, "A1", fmt.Sprintf("%c1", 'A'+len(detailHeaders)-1), headerStyle)

	// 获取详细盘点记录
	var records []struct {
		TaskName       string    `json:"task_name"`
		AssetNo        string    `json:"asset_no"`
		AssetName      string    `json:"asset_name"`
		CategoryName   string    `json:"category_name"`
		DepartmentName string    `json:"department_name"`
		ExpectedStatus string    `json:"expected_status"`
		ActualStatus   string    `json:"actual_status"`
		Result         string    `json:"result"`
		CheckerName    string    `json:"checker_name"`
		CheckedAt      time.Time `json:"checked_at"`
		Notes          string    `json:"notes"`
	}

	// 构建查询
	recordQuery := global.DB.Table("inventory_records ir").
		Select(`
			it.task_name,
			a.asset_no,
			a.name as asset_name,
			c.name as category_name,
			d.name as department_name,
			a.status as expected_status,
			ir.actual_status,
			ir.result,
			ir.checker_name,
			ir.checked_at,
			ir.notes
		`).
		Joins("JOIN inventory_tasks it ON it.id = ir.task_id").
		Joins("JOIN assets a ON a.id = ir.asset_id").
		Joins("LEFT JOIN categories c ON c.id = a.category_id").
		Joins("LEFT JOIN departments d ON d.id = a.department_id")

	// 应用筛选条件
	if len(tasks) > 0 {
		var taskIDs []uint
		for _, task := range tasks {
			taskIDs = append(taskIDs, task.ID)
		}
		recordQuery = recordQuery.Where("ir.task_id IN ?", taskIDs)
	}

	if categoryID != "" {
		recordQuery = recordQuery.Where("a.category_id = ?", categoryID)
	}

	if departmentID != "" {
		recordQuery = recordQuery.Where("a.department_id = ?", departmentID)
	}

	recordQuery = recordQuery.Order("ir.checked_at DESC")

	if err := recordQuery.Find(&records).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    "DATABASE_ERROR",
			"message": "查询盘点记录失败",
			"data":    err.Error(),
		})
		return
	}

	// 填充详细记录数据
	rowIndex = 2
	for _, record := range records {
		// 状态显示转换
		expectedStatusDisplay := record.ExpectedStatus
		actualStatusDisplay := record.ActualStatus
		resultDisplay := record.Result

		switch record.ExpectedStatus {
		case "available":
			expectedStatusDisplay = "可用"
		case "borrowed":
			expectedStatusDisplay = "借用中"
		case "maintenance":
			expectedStatusDisplay = "维护中"
		case "scrapped":
			expectedStatusDisplay = "已报废"
		}

		switch record.ActualStatus {
		case "available":
			actualStatusDisplay = "可用"
		case "borrowed":
			actualStatusDisplay = "借用中"
		case "maintenance":
			actualStatusDisplay = "维护中"
		case "scrapped":
			actualStatusDisplay = "已报废"
		}

		switch record.Result {
		case "normal":
			resultDisplay = "正常"
		case "surplus":
			resultDisplay = "盘盈"
		case "deficit":
			resultDisplay = "盘亏"
		case "damaged":
			resultDisplay = "损坏"
		}

		data := []interface{}{
			record.TaskName,
			record.AssetNo,
			record.AssetName,
			record.CategoryName,
			record.DepartmentName,
			expectedStatusDisplay,
			actualStatusDisplay,
			resultDisplay,
			record.CheckerName,
			record.CheckedAt.Format("2006-01-02 15:04:05"),
			record.Notes,
		}

		for j, value := range data {
			cell := fmt.Sprintf("%c%d", 'A'+j, rowIndex)
			f.SetCellValue(detailSheet, cell, value)
		}
		rowIndex++
	}

	// 设置活动工作表为概览
	f.SetActiveSheet(overviewIndex)

	// 生成唯一文件名
	timestamp := time.Now().Format("20060102_150405")
	randomStr := fmt.Sprintf("%06d", time.Now().Nanosecond()%1000000)
	filename := fmt.Sprintf("inventory_report_%s_%s.xlsx", timestamp, randomStr)

	// 确保导出目录存在
	exportDir := "./uploads/exports"
	if err := os.MkdirAll(exportDir, 0755); err != nil {
		utils.InternalError(c, fmt.Errorf("创建导出目录失败: %v", err))
		return
	}

	// 保存文件到文件系统
	filepath := fmt.Sprintf("%s/%s", exportDir, filename)
	if err := f.SaveAs(filepath); err != nil {
		utils.InternalError(c, fmt.Errorf("保存报表文件失败: %v", err))
		return
	}

	// 获取文件大小
	if fileInfo, err := os.Stat(filepath); err == nil {
		fileSize := fileInfo.Size()
		// 异步记录报表生成
		go func() {
			recordReportGeneration("盘点统计报表", models.ReportRecordTypeInventory, models.ReportRecordFormatExcel, filename, &fileSize, "系统用户", parameters)
		}()
	}

	// 返回下载URL
	downloadURL := utils.GetFileURL(c.GetString("base_url"), fmt.Sprintf("/api/assets/download/%s", filename))
	response := gin.H{
		"download_url": downloadURL,
		"filename":     filename,
		"message":      "盘点报表已生成",
	}

	utils.Success(c, response)
}

// exportInventoryReportsToCSVFile 导出盘点报表到CSV文件
func exportInventoryReportsToCSVFile(c *gin.Context, parameters map[string]interface{}) {
	// 从parameters中获取筛选条件
	startDate := ""
	endDate := ""
	taskType := ""
	status := ""
	categoryID := ""
	departmentID := ""
	if parameters != nil {
		if sd, ok := parameters["start_date"].(string); ok {
			startDate = sd
		}
		if ed, ok := parameters["end_date"].(string); ok {
			endDate = ed
		}
		if tt, ok := parameters["task_type"].(string); ok {
			taskType = tt
		}
		if st, ok := parameters["status"].(string); ok {
			status = st
		}
		if cid, ok := parameters["category_id"].(string); ok {
			categoryID = cid
		}
		if did, ok := parameters["department_id"].(string); ok {
			departmentID = did
		}
	}

	// 构建查询条件
	query := global.DB.Model(&models.InventoryTask{})

	if startDate != "" {
		if start, err := time.Parse("2006-01-02", startDate); err == nil {
			query = query.Where("created_at >= ?", start)
		}
	}

	if endDate != "" {
		if end, err := time.Parse("2006-01-02", endDate); err == nil {
			query = query.Where("created_at <= ?", end.Add(24*time.Hour))
		}
	}

	if taskType != "" {
		query = query.Where("task_type = ?", taskType)
	}

	if status != "" {
		query = query.Where("status = ?", status)
	}

	// 获取盘点任务数据
	var tasks []models.InventoryTask
	if err := query.Find(&tasks).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    "DATABASE_ERROR",
			"message": "查询盘点任务失败",
			"data":    err.Error(),
		})
		return
	}

	// 生成唯一文件名
	timestamp := time.Now().Format("20060102_150405")
	randomStr := fmt.Sprintf("%06d", time.Now().Nanosecond()%1000000)
	filename := fmt.Sprintf("inventory_report_%s_%s.csv", timestamp, randomStr)

	// 确保导出目录存在
	exportDir := "./uploads/exports"
	if err := os.MkdirAll(exportDir, 0755); err != nil {
		utils.InternalError(c, fmt.Errorf("创建导出目录失败: %v", err))
		return
	}

	// 创建CSV文件
	filepath := fmt.Sprintf("%s/%s", exportDir, filename)
	file, err := os.Create(filepath)
	if err != nil {
		utils.InternalError(c, fmt.Errorf("创建CSV文件失败: %v", err))
		return
	}
	defer file.Close()

	writer := csv.NewWriter(file)
	defer writer.Flush()

	// 写入表头
	headers := []string{"任务名称", "资产编号", "资产名称", "分类", "部门", "预期状态", "实际状态", "盘点结果", "盘点人", "盘点时间", "备注"}
	if err := writer.Write(headers); err != nil {
		utils.InternalError(c, fmt.Errorf("写入CSV表头失败: %v", err))
		return
	}

	// 获取详细盘点记录
	var records []struct {
		TaskName       string    `json:"task_name"`
		AssetNo        string    `json:"asset_no"`
		AssetName      string    `json:"asset_name"`
		CategoryName   string    `json:"category_name"`
		DepartmentName string    `json:"department_name"`
		ExpectedStatus string    `json:"expected_status"`
		ActualStatus   string    `json:"actual_status"`
		Result         string    `json:"result"`
		CheckerName    string    `json:"checker_name"`
		CheckedAt      time.Time `json:"checked_at"`
		Notes          string    `json:"notes"`
	}

	// 构建查询
	recordQuery := global.DB.Table("inventory_records ir").
		Select(`
			it.task_name,
			a.asset_no,
			a.name as asset_name,
			c.name as category_name,
			d.name as department_name,
			a.status as expected_status,
			ir.actual_status,
			ir.result,
			ir.checker_name,
			ir.checked_at,
			ir.notes
		`).
		Joins("JOIN inventory_tasks it ON it.id = ir.task_id").
		Joins("JOIN assets a ON a.id = ir.asset_id").
		Joins("LEFT JOIN categories c ON c.id = a.category_id").
		Joins("LEFT JOIN departments d ON d.id = a.department_id")

	// 应用筛选条件
	if len(tasks) > 0 {
		var taskIDs []uint
		for _, task := range tasks {
			taskIDs = append(taskIDs, task.ID)
		}
		recordQuery = recordQuery.Where("ir.task_id IN ?", taskIDs)
	}

	if categoryID != "" {
		recordQuery = recordQuery.Where("a.category_id = ?", categoryID)
	}

	if departmentID != "" {
		recordQuery = recordQuery.Where("a.department_id = ?", departmentID)
	}

	recordQuery = recordQuery.Order("ir.checked_at DESC")

	if err := recordQuery.Find(&records).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    "DATABASE_ERROR",
			"message": "查询盘点记录失败",
			"data":    err.Error(),
		})
		return
	}

	// 写入数据
	for _, record := range records {
		// 状态显示转换
		expectedStatusDisplay := record.ExpectedStatus
		actualStatusDisplay := record.ActualStatus
		resultDisplay := record.Result

		switch record.ExpectedStatus {
		case "available":
			expectedStatusDisplay = "可用"
		case "borrowed":
			expectedStatusDisplay = "借用中"
		case "maintenance":
			expectedStatusDisplay = "维护中"
		case "scrapped":
			expectedStatusDisplay = "已报废"
		}

		switch record.ActualStatus {
		case "available":
			actualStatusDisplay = "可用"
		case "borrowed":
			actualStatusDisplay = "借用中"
		case "maintenance":
			actualStatusDisplay = "维护中"
		case "scrapped":
			actualStatusDisplay = "已报废"
		}

		switch record.Result {
		case "normal":
			resultDisplay = "正常"
		case "surplus":
			resultDisplay = "盘盈"
		case "deficit":
			resultDisplay = "盘亏"
		case "damaged":
			resultDisplay = "损坏"
		}

		row := []string{
			record.TaskName,
			record.AssetNo,
			record.AssetName,
			record.CategoryName,
			record.DepartmentName,
			expectedStatusDisplay,
			actualStatusDisplay,
			resultDisplay,
			record.CheckerName,
			record.CheckedAt.Format("2006-01-02 15:04:05"),
			record.Notes,
		}

		if err := writer.Write(row); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"code":    "EXPORT_ERROR",
				"message": "写入CSV数据失败",
				"data":    err.Error(),
			})
			return
		}
	}

	// 获取文件大小
	if fileInfo, err := os.Stat(filepath); err == nil {
		fileSize := fileInfo.Size()
		// 异步记录报表生成
		go func() {
			recordReportGeneration("盘点统计报表", models.ReportRecordTypeInventory, models.ReportRecordFormatCSV, filename, &fileSize, "系统用户", parameters)
		}()
	}

	// 返回下载URL
	downloadURL := utils.GetFileURL(c.GetString("base_url"), fmt.Sprintf("/api/assets/download/%s", filename))
	response := gin.H{
		"download_url": downloadURL,
		"filename":     filename,
		"message":      "盘点报表已生成",
	}

	utils.Success(c, response)
}

// exportCustomReportsToExcelFile 导出自定义报表到Excel文件
func exportCustomReportsToExcelFile(c *gin.Context, req CustomReportRequest) {
	// 获取自定义报表数据
	var data []map[string]interface{}

	switch req.ReportType {
	case "asset":
		data, _, _ = generateCustomAssetReport(req)
	case "borrow":
		data, _, _ = generateCustomBorrowReport(req)
	case "inventory":
		data, _, _ = generateCustomInventoryReport(req)
	default:
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    "INVALID_REPORT_TYPE",
			"message": "不支持的报表类型",
		})
		return
	}

	f := excelize.NewFile()
	defer f.Close()

	sheetName := "自定义报表"
	index, err := f.NewSheet(sheetName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    "EXPORT_ERROR",
			"message": "创建工作表失败",
			"data":    err.Error(),
		})
		return
	}

	// 如果有数据，设置表头和数据
	if len(data) > 0 {
		// 获取列名作为表头
		var headers []string
		for key := range data[0] {
			headers = append(headers, key)
		}

		// 设置表头
		for i, header := range headers {
			cell := fmt.Sprintf("%c1", 'A'+i)
			f.SetCellValue(sheetName, cell, header)
		}

		// 设置表头样式
		headerStyle, _ := f.NewStyle(&excelize.Style{
			Font: &excelize.Font{Bold: true},
			Fill: excelize.Fill{Type: "pattern", Color: []string{"#E0E0E0"}, Pattern: 1},
		})
		f.SetCellStyle(sheetName, "A1", fmt.Sprintf("%c1", 'A'+len(headers)-1), headerStyle)

		// 填充数据
		for i, row := range data {
			for j, header := range headers {
				cell := fmt.Sprintf("%c%d", 'A'+j, i+2)
				value := row[header]
				f.SetCellValue(sheetName, cell, value)
			}
		}
	}

	f.SetActiveSheet(index)

	// 生成唯一文件名
	timestamp := time.Now().Format("20060102_150405")
	randomStr := fmt.Sprintf("%06d", time.Now().Nanosecond()%1000000)
	filename := fmt.Sprintf("custom_report_%s_%s_%s.xlsx", req.ReportType, timestamp, randomStr)

	// 确保导出目录存在
	exportDir := "./uploads/exports"
	if err := os.MkdirAll(exportDir, 0755); err != nil {
		utils.InternalError(c, fmt.Errorf("创建导出目录失败: %v", err))
		return
	}

	// 保存文件到文件系统
	filepath := fmt.Sprintf("%s/%s", exportDir, filename)
	if err := f.SaveAs(filepath); err != nil {
		utils.InternalError(c, fmt.Errorf("保存报表文件失败: %v", err))
		return
	}

	// 获取文件大小并记录报表生成
	if fileInfo, err := os.Stat(filepath); err == nil {
		fileSize := fileInfo.Size()
		parameters := map[string]interface{}{
			"report_type": req.ReportType,
			"filters":     req.Filters,
			"group_by":    req.GroupBy,
			"metrics":     req.Metrics,
			"sort_by":     req.SortBy,
			"sort_order":  req.SortOrder,
			"limit":       req.Limit,
		}
		// 异步记录报表生成
		go func() {
			recordReportGeneration(fmt.Sprintf("自定义报表_%s", req.ReportType), models.ReportRecordTypeCustom, models.ReportRecordFormatExcel, filename, &fileSize, "系统用户", parameters)
		}()
	}

	// 返回下载URL
	downloadURL := utils.GetFileURL(c.GetString("base_url"), fmt.Sprintf("/api/assets/download/%s", filename))
	response := gin.H{
		"download_url": downloadURL,
		"filename":     filename,
		"message":      "自定义报表已生成",
	}

	utils.Success(c, response)
}

// exportCustomReportsToCSVFile 导出自定义报表到CSV文件
func exportCustomReportsToCSVFile(c *gin.Context, req CustomReportRequest) {
	// 获取自定义报表数据
	var data []map[string]interface{}

	switch req.ReportType {
	case "asset":
		data, _, _ = generateCustomAssetReport(req)
	case "borrow":
		data, _, _ = generateCustomBorrowReport(req)
	case "inventory":
		data, _, _ = generateCustomInventoryReport(req)
	default:
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    "INVALID_REPORT_TYPE",
			"message": "不支持的报表类型",
		})
		return
	}

	// 生成唯一文件名
	timestamp := time.Now().Format("20060102_150405")
	randomStr := fmt.Sprintf("%06d", time.Now().Nanosecond()%1000000)
	filename := fmt.Sprintf("custom_report_%s_%s_%s.csv", req.ReportType, timestamp, randomStr)

	// 确保导出目录存在
	exportDir := "./uploads/exports"
	if err := os.MkdirAll(exportDir, 0755); err != nil {
		utils.InternalError(c, fmt.Errorf("创建导出目录失败: %v", err))
		return
	}

	// 创建CSV文件
	filepath := fmt.Sprintf("%s/%s", exportDir, filename)
	file, err := os.Create(filepath)
	if err != nil {
		utils.InternalError(c, fmt.Errorf("创建CSV文件失败: %v", err))
		return
	}
	defer file.Close()

	writer := csv.NewWriter(file)
	defer writer.Flush()

	// 如果有数据，写入表头和数据
	if len(data) > 0 {
		// 获取列名作为表头
		var headers []string
		for key := range data[0] {
			headers = append(headers, key)
		}

		// 写入表头
		writer.Write(headers)

		// 写入数据
		for _, row := range data {
			var values []string
			for _, header := range headers {
				value := row[header]
				if value == nil {
					values = append(values, "")
				} else {
					values = append(values, fmt.Sprintf("%v", value))
				}
			}
			writer.Write(values)
		}
	}

	// 获取文件大小并记录报表生成
	if fileInfo, err := os.Stat(filepath); err == nil {
		fileSize := fileInfo.Size()
		parameters := map[string]interface{}{
			"report_type": req.ReportType,
			"filters":     req.Filters,
			"group_by":    req.GroupBy,
			"metrics":     req.Metrics,
			"sort_by":     req.SortBy,
			"sort_order":  req.SortOrder,
			"limit":       req.Limit,
		}
		// 异步记录报表生成
		go func() {
			recordReportGeneration(fmt.Sprintf("自定义报表_%s", req.ReportType), models.ReportRecordTypeCustom, models.ReportRecordFormatCSV, filename, &fileSize, "系统用户", parameters)
		}()
	}

	// 返回下载URL
	downloadURL := utils.GetFileURL(c.GetString("base_url"), fmt.Sprintf("/api/assets/download/%s", filename))
	response := gin.H{
		"download_url": downloadURL,
		"filename":     filename,
		"message":      "自定义报表已生成",
	}

	utils.Success(c, response)
}
