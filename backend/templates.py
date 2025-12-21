import pandas as pd


def format_ssc_hsc_results(df: pd.DataFrame) -> pd.DataFrame:
    # Check if CQ column exists
    has_cq = 'CQ' in df.columns

    # Calculate Total and Position based on whether CQ exists
    if has_cq:
        try:
            df['MCQ'] = pd.to_numeric(df['MCQ'], errors='coerce').fillna(0)
            df['CQ'] = pd.to_numeric(df['CQ'], errors='coerce').fillna(0)
            df['Total'] = df['MCQ'] + df['CQ']
            highest_marks = df['Total'].max() if not df['Total'].isna().all() else 0
            df['Position'] = df['Total'].rank(ascending=False, method='min').astype('Int64')
        except Exception:
            highest_marks = 0
            df['Position'] = None
    else:
        try:
            df['MCQ'] = pd.to_numeric(df['MCQ'], errors='coerce').fillna(0)
            highest_marks = df['MCQ'].max() if not df['MCQ'].isna().all() else 0
            df['Position'] = df['MCQ'].rank(ascending=False, method='min').astype('Int64')
        except Exception:
            highest_marks = 0
            df['Position'] = None

    def format_result(row):
        try:
            exam = row.get('Exam', '')
            name = row.get('Name', '')
            roll = row.get('Roll', '')
            position = row.get('Position') if row.get('Position') is not None else ''

            # ---------- MCQ + CQ ----------
            if has_cq:
                total = row.get('Total', 0)
                if pd.isna(total) or total == 0:
                    return (
                        f"ফলাফল: {exam}\n"
                        f"Name: {name}, Roll: {roll}, Absent\n"
                        f"Highest Marks: {highest_marks}\n"
                        f"— Big Bang Exam Care"
                    )
                else:
                    mcq = row.get('MCQ', '')
                    cq = row.get('CQ', '')
                    return (
                        f"ফলাফল: {exam}\n"
                        f"Name: {name}, Roll: {roll}, "
                        f"MCQ: {mcq}, CQ: {cq}, "
                        f"Total: {total}, Position: {position}, "
                        f"Highest Marks: {highest_marks}\n"
                        f"— Big Bang Exam Care"
                    )

            # ---------- Only MCQ ----------
            else:
                mcq = row.get('MCQ', 0)
                if pd.isna(mcq) or mcq == 0:
                    return (
                        f"ফলাফল: {exam}\n"
                        f"Name: {name}, Roll: {roll}, Absent\n"
                        f"Highest Marks (MCQ): {highest_marks}\n"
                        f"— Big Bang Exam Care"
                    )
                else:
                    return (
                        f"ফলাফল: {exam}\n"
                        f"Name: {name}, Roll: {roll}, "
                        f"Obtained Marks (MCQ): {mcq}, "
                        f"Position: {position}, "
                        f"Highest Marks (MCQ): {highest_marks}\n"
                        f"— Big Bang Exam Care"
                    )
        except Exception:
            return ''

    df['Result'] = df.apply(format_result, axis=1)
    return df


def format_varsity_results(df: pd.DataFrame) -> pd.DataFrame:
    # Follow user's desired logic: compute highest_total and position (1 = highest)
    if 'Total' in df.columns:
        # Safely coerce to numeric where possible
        try:
            df['Total'] = pd.to_numeric(df['Total'], errors='coerce')
            highest_total = df['Total'].max() if not df['Total'].isna().all() else 0
        except Exception:
            highest_total = 0
            pass
        # Compute position: rank descending, method='min'
        try:
            df['Position'] = df['Total'].rank(ascending=False, method='min').astype('Int64')
        except Exception:
            df['Position'] = None
    else:
        highest_total = 0
        df['Position'] = None

    def format_result(row):
        # Mirror the user's format_result for Varsity/Engineering
        try:
            total = row.get('Total')
            exam = row.get('Exam', '')
            name = row.get('Name', '')
            roll = row.get('Roll', '')
            if pd.isna(total) or total == 0:
                return (
                    f"ফলাফল: {exam}\n"
                    f"Name: {name}, Roll: {roll}, Absent, "
                    f"Highest Marks: {highest_total}\n"
                    f"— Big Bang Exam Care"
                )
            else:
                mcq = row.get('MCQ', '')
                written = row.get('Written', '')
                position = row.get('Position') if row.get('Position') is not None else ''
                return (
                    f"ফলাফল: {exam}\n"
                    f"Name: {name}, Roll: {roll}, "
                    f"MCQ: {mcq}, Written: {written}, "
                    f"Total: {total}, Position: {position}, "
                    f"Highest Marks: {highest_total}.\n"
                    f"— Big Bang Exam Care"
                )
        except Exception:
            return ''

    df['Result'] = df.apply(format_result, axis=1)
    return df


def format_medical_results(df: pd.DataFrame) -> pd.DataFrame:
    # Follow user's desired medical result logic
    if 'Marks' in df.columns:
        try:
            df['Marks'] = pd.to_numeric(df['Marks'], errors='coerce')
        except Exception:
            pass
        #highest_marks = int(df['Marks'].max()) if not df['Marks'].isna().all() else 0
        highest_marks = (df['Marks'].max()) if not df['Marks'].isna().all() else 0
        # Position: rank descending (1 = highest)
        try:
            df['Position'] = df['Marks'].rank(ascending=False, method='min').astype('Int64')
        except Exception:
            df['Position'] = None
    else:
        highest_marks = 0
        df['Position'] = None

    def format_result(row):
        try:
            marks = row.get('Marks')
            exam = row.get('Exam', '')
            name = row.get('Name', '')
            roll = row.get('Roll', '')
            if pd.isna(marks) or marks == 0:
                return (
                    f"ফলাফল: {exam}\n"
                    f"Name: {name}, Roll: {roll}, Absent, "
                    f"Highest Marks: {highest_marks} \n"
                    f"— Big Bang Exam Care"
                )
            else:
                position = row.get('Position') if row.get('Position') is not None else ''
                return (
                    f"ফলাফল: {exam}\n"
                    f"Name: {name}, Roll: {roll}, "
                    f"Obtained Marks: {marks}, "
                    f"Position: {position}, "
                    f"Highest Marks: {highest_marks} \n"
                    f"— Big Bang Exam Care"
                )
        except Exception:
            return ''

    df['Result'] = df.apply(format_result, axis=1)
    return df


