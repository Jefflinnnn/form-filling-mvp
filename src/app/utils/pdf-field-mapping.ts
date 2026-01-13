/**
 * Mapping of our internal field names to ISP-2519 PDF field names
 * Based on the PDF schema from PyPDFForm
 */
export const ISP2519_PDF_FIELD_MAP: { [key: string]: string } = {
    // Section 1 - Patient Information
    'patient_sin': 'txtF_SIN[0]',
    'patient_language': 'rb_language[0]', // 0=English, 1=French
    'patient_salutation': 'rb_salutation[0]', // 0=Mr, 1=Mrs, 2=Ms, 3=Other
    'patient_first_name': 'txtF_FirstNameAndInitial[0]',
    'patient_middle_name': 'txtF_FirstNameAndInitial[1]',
    'patient_last_name': 'txtF_lastNameBirth[0]',
    'patient_dob': 'txtF_DOB[0]',
    'patient_address': 'txtF_homeAddress[0]',
    'patient_phone': 'txtF_telehphone[0]',
    'patient_alternate_phone': 'txtF_alternateTelephone[0]',
    'patient_best_time_to_call': 'rb_best_time_to_call[0]', // 0=Morning, 1=Afternoon, 2=Evening
    'patient_consent': 'rb_Consent[0]', // 0=Yes, 1=No
    'patient_signature': 'txtF_Signature[0]',
    'patient_signature_date': 'df_date[0]',

    // Section 2 - Witness Information
    'witness_given_name': 'txtF_givenName[0]',
    'witness_signature': 'txtF_SignatureWitness[0]',
    'witness_signature_date': 'df_dateWitnessSignature[0]',

    // Section 3 - Medical History
    'how_many_years': 'rb_howManyYears[0]', // 0=<1yr, 1=1-2yrs, 2=2-5yrs, 3=>5yrs
    'number_of_times': 'txtF_numberOfTimes[0]',
    'date_of_last_visit': 'df_dateOfLastVisit[0]',
    'date_first_started': 'df_dateYouFirstStarted[0]',

    // Section 4 - Diagnosis Information
    'diagnosis_1_condition': 'txtF_row1[0]',
    'diagnosis_1_icd': 'txtF_ICDcode[0]',
    'diagnosis_1_date': 'df_row1[0]',

    // Section 5 - Medical Conditions
    'patient_height': 'txtF_patient_height[0]',
    'patient_weight': 'txtF_patient_weight[0]',
    'medical_condition': 'txtF_medicalCondition[0]',
    'date_of_symptom_onset': 'df_dateOfSymptomOnset[0]',
    'impairments': 'txtF_impairment[0]',
    'functional_limitations': 'txtF_functionalLimitations[0]',
    'prognosis': 'rb_prognosis[0]', // Radio button for prognosis
    'expected_duration': 'rb_expectedDuration[0]',
    'frequency': 'rb_frequency[0]',

    // Section 5 - Medications/Dosage/Frequency (Multiple rows)
    'medication_1_name': 'TextField1[0]',
    'medication_1_start_date': 'DateField1[0]',
    'medication_1_end_date': 'DateField4[0]',
    'medication_2_name': 'TextField10[0]',
    'medication_2_start_date': 'DateField6[0]',
    'medication_2_end_date': 'DateField3[0]',
    'medication_3_name': 'TextField9[0]',
    'medication_3_start_date': 'DateField5[0]',
    'medication_3_end_date': 'DateField2[0]',
    'medication_4_name': 'TextField8[0]',

    // Section 5 - Treatment/Investigation (Multiple rows)
    'treatment_1_name': 'TextField22[0]',
    'treatment_1_start_date': 'DateField12[0]',
    'treatment_1_end_date': 'DateField11[0]',
    'treatment_2_name': 'TextField19[0]',
    'treatment_2_start_date': 'DateField10[0]',
    'treatment_2_end_date': 'DateField9[0]',
    'treatment_3_name': 'TextField15[0]',
    'treatment_3_start_date': 'DateField8[0]',
    'treatment_3_end_date': 'DateField7[0]',
    'treatment_4_name': 'TextField14[0]',
    'treatment_4_start_date': 'DateField14[0]',
    'treatment_4_end_date': 'DateField13[0]',

    // Section 6 - Work Status Questions
    'stop_working': 'Yes[0]', // Boolean checkbox
    'return_to_work': 'Yes[1]', // Boolean checkbox

    // Section 7 - Additional Questions
    'question_1': 'rb_Q1[0]',
    'question_2': 'rb_Q2[0]',
    'question_3': 'rb_Q3[0]',
    'question_4': 'rb_Q4[0]',
    'question_4_other': 'txtF_otherQ4[0]',
    'other_relevant_information': 'txtF_otherRelevantInformation[0]',

    // Section 8 - Supporting Documentation
    'medical_investigation': 'medicalInvestigation[0]',
    'medical_investigation_alt': 'medicalInvestigation[1]',
    'specialists_reports': 'specialistsReports[0]',
    'hospital_discharge': 'hospitalDischarge[0]',
    'other_documentation': 'other[0]',
    'other_documentation_text': 'txtF_other[0]',

    // Section 10 - Physician Information
    'section_10_response': 'rb_Section10[0]',
    'physician_name': 'txtF_name[0]',
};

/**
 * Get the PDF field name for a given internal field name
 */
export function getPdfFieldName(internalFieldName: string): string {
    return ISP2519_PDF_FIELD_MAP[internalFieldName] || internalFieldName;
}

/**
 * Check if a field is a checkbox/boolean field
 */
export function isCheckboxField(pdfFieldName: string): boolean {
    return pdfFieldName.startsWith('Yes[') ||
        pdfFieldName.includes('Investigation') ||
        pdfFieldName.includes('Reports') ||
        pdfFieldName.includes('Discharge') ||
        pdfFieldName === 'other[0]';
}

/**
 * Check if a field is a radio button field
 */
export function isRadioButtonField(pdfFieldName: string): boolean {
    return pdfFieldName.startsWith('rb_');
}
