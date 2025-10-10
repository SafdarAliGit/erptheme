import frappe
from frappe import _, whitelist

@frappe.whitelist(allow_guest=True)
def get_dashboard_data(from_date=None, to_date=None, from_year=None, to_year=None):
    data = {}

    # Convert dates if provided
    if from_date:
        from_date = frappe.utils.getdate(from_date)
    if to_date:
        to_date = frappe.utils.getdate(to_date)

    # 🏥 **General Statistics (Graph Data)**
    data_list = []

    # =====SUMMARY START=====
    headcount = frappe.db.sql("""
        SELECT COUNT(*) as headcount FROM `tabEmployee` WHERE
        (%s IS NULL OR date_of_joining >= %s)
        AND (%s IS NULL OR date_of_joining <= %s)
    """, (from_date, from_date, to_date, to_date), as_dict=True)

    headcount_in_active = frappe.db.sql("""
        SELECT COUNT(*) as headcount FROM `tabEmployee` WHERE
        status != 'Active'
        AND (%s IS NULL OR date_of_joining >= %s)
        AND (%s IS NULL OR date_of_joining <= %s)
    """, (from_date, from_date, to_date, to_date), as_dict=True)

    headcount_active = frappe.db.sql("""
        SELECT COUNT(*) as headcount FROM `tabEmployee` WHERE
        status = 'Active'
        AND (%s IS NULL OR date_of_joining >= %s)
        AND (%s IS NULL OR date_of_joining <= %s)
    """, (from_date, from_date, to_date, to_date), as_dict=True)
    
    headcount_saudi = frappe.db.sql("""
        SELECT COUNT(*) as headcount FROM `tabEmployee` WHERE status = 'Active' 
        AND custom_saudi_ = 1
        AND (%s IS NULL OR date_of_joining >= %s)
        AND (%s IS NULL OR date_of_joining <= %s)
    """, (from_date, from_date, to_date, to_date), as_dict=True)
    
    headcount_non_saudi = frappe.db.sql("""
        SELECT COUNT(*) as headcount FROM `tabEmployee` WHERE status = 'Active' 
        AND custom_non_saudi = 1
        AND (%s IS NULL OR date_of_joining >= %s)
        AND (%s IS NULL OR date_of_joining <= %s)
    """, (from_date, from_date, to_date, to_date), as_dict=True)

    male = frappe.db.sql("""
        SELECT 
            COUNT(CASE WHEN gender = 'Male' THEN 1 END) as male
        FROM `tabEmployee`
        WHERE status = 'Active'
        AND (%s IS NULL OR date_of_joining >= %s)
        AND (%s IS NULL OR date_of_joining <= %s)
    """, (from_date, from_date, to_date, to_date), as_dict=True)[0]['male']
    female = frappe.db.sql("""
        SELECT 
            COUNT(CASE WHEN gender = 'Female' THEN 1 END) as female
        FROM `tabEmployee`
        WHERE status = 'Active'
        AND (%s IS NULL OR date_of_joining >= %s)
        AND (%s IS NULL OR date_of_joining <= %s)
    """, (from_date, from_date, to_date, to_date), as_dict=True)[0]['female']

    # Modified query for total leaves by branch
    leave_data = frappe.db.sql("""
        SELECT
            IFNULL(emp.branch, 'Unassigned') AS branch,
            COUNT(*) AS total_leaves
        FROM `tabLeave Ledger Entry` AS ledger
        JOIN `tabEmployee` AS emp
            ON ledger.employee = emp.name
        WHERE ledger.docstatus = 1
        AND (%(from_date)s IS NULL OR ledger.from_date >= %(from_date)s)
        AND (%(to_date)s IS NULL OR ledger.to_date <= %(to_date)s)
        GROUP BY branch
        ORDER BY total_leaves DESC
    """, {
        "from_date": from_date,
        "to_date": to_date
    }, as_dict=True)
    data["leave_data"] = leave_data

    leave_data_by_leave_type = frappe.db.sql("""
        SELECT
            ledger.leave_type AS leave_type,
            COUNT(*) AS total_leaves
        FROM `tabLeave Ledger Entry` AS ledger
        JOIN `tabEmployee` AS emp
            ON ledger.employee = emp.name
        WHERE ledger.docstatus = 1
        AND (%(from_date)s IS NULL OR ledger.from_date >= %(from_date)s)
        AND (%(to_date)s IS NULL OR ledger.to_date <= %(to_date)s)
        GROUP BY leave_type
        ORDER BY total_leaves DESC
    """, {
        "from_date": from_date,
        "to_date": to_date
    }, as_dict=True)
    data["leave_data_by_leave_type"] = leave_data_by_leave_type

    head_count_by_nationality = frappe.db.sql("""
    SELECT
        COALESCE(custom_nationality, 'Unknown') AS nationality,
        COUNT(*) AS head_count
    FROM `tabEmployee`
    WHERE status = 'Active'
    AND (%s IS NULL OR date_of_joining >= %s)
    AND (%s IS NULL OR date_of_joining <= %s)
    GROUP BY COALESCE(custom_nationality, 'Unknown')
    """, (from_date, from_date, to_date, to_date), as_dict=True)
    
    data["head_count_by_nationality"] = head_count_by_nationality

    ctc_by_branch = frappe.db.sql("""
    SELECT
        COALESCE(branch, 'Unknown') AS branch,
        SUM(ctc) AS ctc
    FROM `tabEmployee`
    WHERE status = 'Active'
    AND (%s IS NULL OR date_of_joining >= %s)
    AND (%s IS NULL OR date_of_joining <= %s)
    GROUP BY COALESCE(branch, 'Unknown')
    """, (from_date, from_date, to_date, to_date), as_dict=True)
    data["ctc_by_branch"] = ctc_by_branch


    data_list.append({
        "title": "Total Headcount",
        "data": headcount[0]["headcount"],
        "index": 1
    })

    data_list.append({
        "title": "Headcount Inactive",
        "data": headcount_in_active[0]["headcount"],
        "index": 2
    })
    data_list.append({
        "title": "Headcount Active",
        "data": headcount_active[0]["headcount"],
        "index": 3
    })

    data_list.append({
        "title": "Saudi",
        "data": headcount_saudi[0]["headcount"],
        "index": 4
    })

    data_list.append({
        "title": "Non Saudi",
        "data": headcount_non_saudi[0]["headcount"],
        "index": 5
    })

    data_list.append({
        "title": "Male",
        "data": male,
        "index": 6
    })
    data_list.append({
        "title": "Female",
        "data": female,
        "index": 7
    })

    expiring_iqamas = frappe.db.sql("""
        SELECT 
            employee_name,
            custom_iqama_expiry_date
        FROM `tabEmployee`
        WHERE status = 'Active'
        AND custom_non_saudi = 1
        AND custom_iqama_expiry_date IS NOT NULL
        AND custom_iqama_expiry_date >= DATE_ADD(CURDATE(), INTERVAL 2 MONTH)
        AND (%s IS NULL OR date_of_joining >= %s)
        AND (%s IS NULL OR date_of_joining <= %s)
        ORDER BY custom_iqama_expiry_date ASC
    """, (from_date, from_date, to_date, to_date), as_dict=True)
    data["expiring_iqamas"] = expiring_iqamas
   
    
    data["graph_data"] = data_list

    expiring_work_permits = frappe.db.sql("""
        SELECT 
            employee_name,
            custom_work_permits_expiry_date
        FROM `tabEmployee`
        WHERE status = 'Active'
        AND custom_work_permits_expiry_date IS NOT NULL
        AND custom_work_permits_expiry_date >= DATE_ADD(CURDATE(), INTERVAL 2 MONTH)
        AND (%s IS NULL OR date_of_joining >= %s)
        AND (%s IS NULL OR date_of_joining <= %s)
        ORDER BY custom_work_permits_expiry_date ASC
    """, (from_date, from_date, to_date, to_date), as_dict=True)
    data["expiring_work_permits"] = expiring_work_permits

    # ======SUMMARY END======

    # ======EMPLOYEE OVERVIEW START======
    headcount_overview = frappe.db.sql("""
    SELECT COUNT(*) as headcount
    FROM `tabEmployee`
    """, as_dict=True)
    
    data_list.append({
        "title": "Headcount",
        "data": headcount_overview[0]["headcount"],
        "index": 8
    })

    hires = frappe.db.sql("""
    SELECT COUNT(*) AS hire_count
    FROM `tabEmployee`
    WHERE
        (%(from_year)s IS NULL OR YEAR(date_of_joining) >= %(from_year)s)
      AND (%(to_year)s   IS NULL OR YEAR(date_of_joining) <= %(to_year)s)
    """, {
        "from_year": from_year,
        "to_year": to_year
    }, as_dict=True)

    data_list.append({
        "title": "Hires",
        "data": hires[0]["hire_count"],
        "index": 9
    })

    termination_count = frappe.db.sql("""
    SELECT COUNT(*) AS terminations
    FROM `tabEmployee`
    WHERE
        (%(from_year)s IS NULL OR YEAR(relieving_date) >= %(from_year)s)
      AND (%(to_year)s   IS NULL OR YEAR(relieving_date) <= %(to_year)s)
      AND relieving_date IS NOT NULL
    """, {
        "from_year": from_year,
        "to_year": to_year
    }, as_dict=True)

    # termination_count[0].terminations

    data_list.append({
        "title": "Terminations",
        "data": termination_count[0]["terminations"],
        "index": 10
    })

    data_list.append({
        "title": "Turnover Rate",
        "data": round(float(termination_count[0]["terminations"] or 0) / float(headcount_overview[0]["headcount"] or 1) * 100, 2),
        "index": 11
    })

    avg_age = frappe.db.sql("""
    SELECT AVG(
        FLOOR(
            DATEDIFF(CURDATE(), date_of_birth) / 365
        )
    ) AS average_age
    FROM `tabEmployee`
    WHERE date_of_birth IS NOT NULL
      AND (%(from_year)s IS NULL OR YEAR(date_of_birth) >= %(from_year)s)
      AND (%(to_year)s   IS NULL OR YEAR(date_of_birth) <= %(to_year)s)
    """, {
        "from_year": from_year,
        "to_year": to_year
    }, as_dict=True)

    # avg_age[0].average_age will have the result (could be None if nobody meets criteria)
    data_list.append({
        "title": "Average Age",
        "data": round(avg_age[0].average_age or 0, 2),
        "index": 12
    })

    data_list.append({
        "title": "Male %",
        "data": round(float(male or 0) / float(headcount_overview[0]["headcount"] or 1) * 100, 2),
        "index": 13
    })

    data_list.append({
        "title": "Female %",
        "data": round(float(female or 0) / float(headcount_overview[0]["headcount"] or 1) * 100, 2),
        "index": 14
    })

    head_count_by_age_groups = frappe.db.sql("""
    SELECT 
        COUNT(CASE WHEN TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) BETWEEN 21 AND 25 THEN 1 END) as `21_25`,
        COUNT(CASE WHEN TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) BETWEEN 26 AND 30 THEN 1 END) as `26_30`,
        COUNT(CASE WHEN TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) BETWEEN 31 AND 35 THEN 1 END) as `31_35`,
        COUNT(CASE WHEN TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) BETWEEN 36 AND 40 THEN 1 END) as `36_40`,
        COUNT(CASE WHEN TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) BETWEEN 41 AND 45 THEN 1 END) as `41_45`,
        COUNT(CASE WHEN TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) BETWEEN 46 AND 50 THEN 1 END) as `46_50`,
        COUNT(CASE WHEN TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) > 50 THEN 1 END) as `above_50`
    FROM `tabEmployee`
    WHERE status = 'Active'
    AND (%s IS NULL OR YEAR(date_of_joining) >= %s)
    AND (%s IS NULL OR YEAR(date_of_joining) <= %s)
    AND date_of_birth IS NOT NULL
    """, (from_year, from_year, to_year, to_year), as_dict=True)[0]

    # Prepare data for chart
    head_count_by_age_groups_chart_data = {
        "labels": ["21-25", "26-30", "31-35", "36-40", "41-45", "46-50", "50+"],
        "values": [
            head_count_by_age_groups["21_25"],
            head_count_by_age_groups["26_30"], 
            head_count_by_age_groups["31_35"],
            head_count_by_age_groups["36_40"],
            head_count_by_age_groups["41_45"],
            head_count_by_age_groups["46_50"],
            head_count_by_age_groups["above_50"]
        ]
    }
    data["head_count_by_age_groups"] = head_count_by_age_groups_chart_data

    head_count_by_department = frappe.db.sql("""
        SELECT 
            IFNULL(department, 'Unassigned') as department,
            COUNT(*) as employee_count
        FROM `tabEmployee`
        WHERE status = 'Active'
        AND (%s IS NULL OR YEAR(date_of_joining) >= %s)
        AND (%s IS NULL OR YEAR(date_of_joining) <= %s)
        GROUP BY department
        ORDER BY employee_count DESC
    """, (from_year, from_year, to_year, to_year), as_dict=True)
    data["head_count_by_department"] = head_count_by_department

    head_count_by_employment_type = frappe.db.sql("""
        SELECT 
            IFNULL(employment_type, 'Unassigned') as employment_type,
            COUNT(*) as employee_count
        FROM `tabEmployee`
        WHERE status = 'Active'
        AND (%s IS NULL OR YEAR(date_of_joining) >= %s)
        AND (%s IS NULL OR YEAR(date_of_joining) <= %s)
        GROUP BY employment_type
        ORDER BY employee_count DESC
    """, (from_year, from_year, to_year, to_year), as_dict=True)
    data["head_count_by_employment_type"] = head_count_by_employment_type

    # ======EMPLOYEE OVERVIEW END======

    return data

@frappe.whitelist(allow_guest=True)
def get_salary_analysis_data(from_date=None, to_date=None):
    data = {}
    data_list = []
    employee_list = frappe.db.sql("""
        SELECT
            employee_name,
            department,
            salary_currency,
            ctc
        FROM `tabEmployee`
        WHERE status = 'Active'
          AND (%s IS NULL OR date_of_joining >= %s)
          AND (%s IS NULL OR date_of_joining <= %s)
        ORDER BY employee_name;

    """, (from_date, to_date, from_date, to_date), as_dict=True)
    data["employee_list"] = employee_list

    total_ctc = frappe.db.sql("""
        SELECT
            SUM(ctc) as total_salary_expense
        FROM `tabEmployee`
        WHERE status = 'Active'
          AND (%s IS NULL OR date_of_joining >= %s)
          AND (%s IS NULL OR date_of_joining <= %s)
    """, (from_date, to_date, from_date, to_date), as_dict=True)

    data_list.append({
        "title": "Total Salary Expense",
        "data": total_ctc[0]["total_salary_expense"],
        "index": 15
    })
    avg_monthly_ctc = frappe.db.sql("""
        SELECT
            (SUM(ctc)/12.0)/COUNT(*) AS avg_monthly_salary
        FROM `tabEmployee`
        WHERE status = 'Active'
          AND (%s IS NULL OR date_of_joining >= %s)
          AND (%s IS NULL OR date_of_joining <= %s)
    """, (from_date, to_date, from_date, to_date), as_dict=True)
    data_list.append(
        {
            "title": "Average Monthly Salary",
            "data": round(avg_monthly_ctc[0]["avg_monthly_salary"] or 0, 2),
            "index": 16
        }   
    )
    avg_salary_by_gender = frappe.db.sql("""
        SELECT 
            gender,
            ROUND(AVG(ctc / 12), 2) AS avg_monthly_salary
        FROM `tabEmployee`
        WHERE status = 'Active'
        AND (%s IS NULL OR date_of_joining >= %s)
        AND (%s IS NULL OR date_of_joining <= %s)
        AND gender IS NOT NULL 
        GROUP BY gender
        ORDER BY gender
    """, (from_date, to_date, from_date, to_date), as_dict=True)
    data["avg_salary_by_gender"] = avg_salary_by_gender

    data["graph_data"] = data_list

    avg_salary_by_department = frappe.db.sql("""
        SELECT 
            department,
            ROUND(AVG(ctc / 12), 2) AS avg_monthly_salary
        FROM `tabEmployee`
        WHERE status = 'Active'
        AND (%s IS NULL OR date_of_joining >= %s)
        AND (%s IS NULL OR date_of_joining <= %s)
        AND department IS NOT NULL 
        GROUP BY department
        ORDER BY department
    """, (from_date, to_date, from_date, to_date), as_dict=True)
    data["avg_salary_by_department"] = avg_salary_by_department

    data["graph_data"] = data_list

    # head_count_and_avg_salary_by_age_groups = frappe.db.sql("""
    # SELECT 

    #     AVG(CASE WHEN TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) BETWEEN 21 AND 25 THEN ctc END) as `21_25_avg_salary`,
    #     AVG(CASE WHEN TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) BETWEEN 26 AND 30 THEN ctc END) as `26_30_avg_salary`,
    #     AVG(CASE WHEN TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) BETWEEN 31 AND 35 THEN ctc END) as `31_35_avg_salary`,
    #     AVG(CASE WHEN TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) BETWEEN 36 AND 40 THEN ctc END) as `36_40_avg_salary`,
    #     AVG(CASE WHEN TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) BETWEEN 41 AND 45 THEN ctc END) as `41_45_avg_salary`,
    #     AVG(CASE WHEN TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) BETWEEN 46 AND 50 THEN ctc END) as `46_50_avg_salary`,
    #     AVG(CASE WHEN TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) > 50 THEN ctc END) as `above_50_avg_salary`
    # FROM `tabEmployee`
    # WHERE status = 'Active'
    # AND (%s IS NULL OR date_of_joining >= %s)
    # AND (%s IS NULL OR date_of_joining <= %s)
    # AND date_of_birth IS NOT NULL
    # """, (from_date, to_date, from_date, to_date), as_dict=True)[0]

    # chart_data = {
    # "labels": ["21-25", "26-30", "31-35", "36-40", "41-45", "46-50", "50+"],
   
    # "avg_salary": [
    #     round(head_count_and_avg_salary_by_age_groups["21_25_avg_salary"], 2),
    #     round(head_count_and_avg_salary_by_age_groups["26_30_avg_salary"], 2),
    #     round(head_count_and_avg_salary_by_age_groups["31_35_avg_salary"], 2),
    #     round(head_count_and_avg_salary_by_age_groups["36_40_avg_salary"], 2),
    #     round(head_count_and_avg_salary_by_age_groups["41_45_avg_salary"], 2),
    #     round(head_count_and_avg_salary_by_age_groups["46_50_avg_salary"], 2),
    #     round(head_count_and_avg_salary_by_age_groups["above_50_avg_salary"], 2)
    # ]
    # }
    # data["headcount_and_avg_salary_by_age_groups"] = chart_data




    return data


@frappe.whitelist(allow_guest=True)
def get_company_list():
    company_list = frappe.db.sql_list("""
    SELECT name FROM `tabCompany`
    ORDER BY name ASC
    """)
    return company_list



