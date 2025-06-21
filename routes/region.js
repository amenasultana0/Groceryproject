const express = require('express');
const router = express.Router();

// Updated static mapping to match dropdown values
const pincodeRegionMap = {
  '110001': 'Delhi-NCR',
  '400001': 'Maharashtra',
  '122001': 'Punjab-Haryana',
  '226001': 'Uttar Pradesh',
  '800001': 'Bihar-Jharkhand',
  '700001': 'West Bengal',
  '302001': 'Rajasthan',
  '380001': 'Gujarat',
  '462001': 'Madhya Pradesh-Chhattisgarh',
  '560001': 'Karnataka',
  '682001': 'Kerala',
  '600001': 'Tamil Nadu',
  '500001': 'Andhra-Telangana',
  '751001': 'Odisha',
  '793001': 'North-East',
  '248001': 'Himachal-J&K-Uttarakhand',
  '403001': 'Goa-Konkan',
  '744101': 'Andaman-Nicobar'
  // ...add more as needed
};

router.get('/:pincode', (req, res) => {
  const region = pincodeRegionMap[req.params.pincode] || 'Unknown';
  res.json({ region });
});

module.exports = router;