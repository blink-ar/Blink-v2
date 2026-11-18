/** Client-safe temporary upstream promotion quarantine. No mutation or ID rewrite. */
export function isCuentaDni1069Quarantined(value, enabled=true) {
 if(!enabled||!value||typeof value!=='object')return false;
 const canonical=/^cuentadni-benefit-1069(?:-|$)/i,raw=/^benefit:1069(?:-|$)/i;
 if(['id','_id','originalId','benefitDetailId','rawBenefitId'].some(k=>typeof value[k]==='string'&&(canonical.test(value[k])||raw.test(value[k]))))return true;
 const marker=/^(?:CuentaDNI|CuentaDNI_BENEFITS|CUENTADNI_PROMOS_RAW|cuenta[ _-]?dni)$/i;
 return ['sourceCollection','rawBenefitCollection','source','sourceType','bank'].some(k=>typeof value[k]==='string'&&marker.test(value[k]))&&(value.benefitId===1069||value.benefitId==='1069');
}
