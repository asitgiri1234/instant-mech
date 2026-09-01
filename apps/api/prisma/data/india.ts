/**
 * Static, hand-curated reference data for the seed.
 *
 * Faker's western name/vehicle corpora produce data that looks obviously fake for
 * an Indian roadside-servicing business, so names, registration plates and the
 * vehicle catalogue are curated here instead. Faker is still used for the random
 * *choices* and for anything where realism does not depend on the corpus.
 */

export const FIRST_NAMES = [
  "Aarav", "Aditya", "Advait", "Akash", "Aman", "Ananya", "Anjali", "Ankit",
  "Arjun", "Ashwin", "Bhavna", "Chetan", "Deepak", "Devika", "Divya", "Farhan",
  "Gaurav", "Harpreet", "Harsh", "Ishaan", "Ishita", "Jatin", "Kabir", "Kavya",
  "Kiran", "Lakshmi", "Mahesh", "Manav", "Meera", "Mohit", "Naveen", "Neha",
  "Nikhil", "Nisha", "Pallavi", "Parth", "Pooja", "Prakash", "Pranav", "Priya",
  "Rahul", "Rajesh", "Rakesh", "Ramesh", "Rashmi", "Ravi", "Riya", "Rohan",
  "Rohit", "Sagar", "Sameer", "Sandeep", "Sanjay", "Sanya", "Shreya", "Shruti",
  "Siddharth", "Simran", "Sneha", "Sunil", "Suresh", "Swati", "Tanvi", "Tarun",
  "Uday", "Vaishnavi", "Varun", "Vikram", "Vinod", "Vishal", "Yash", "Zoya",
] as const;

export const LAST_NAMES = [
  "Agarwal", "Ahuja", "Bansal", "Bhat", "Bose", "Chauhan", "Chopra", "Das",
  "Deshmukh", "Dubey", "Gandhi", "Ghosh", "Gill", "Gupta", "Iyer", "Jain",
  "Joshi", "Kapoor", "Kaur", "Khanna", "Kulkarni", "Kumar", "Malhotra", "Mehta",
  "Menon", "Mishra", "Mukherjee", "Nair", "Nanda", "Patel", "Pillai", "Prasad",
  "Rana", "Rao", "Reddy", "Saxena", "Sethi", "Shah", "Sharma", "Shetty",
  "Singh", "Sinha", "Thakur", "Tiwari", "Trivedi", "Varma", "Verma", "Yadav",
] as const;

export const EMAIL_DOMAINS = [
  "gmail.com", "gmail.com", "gmail.com", "yahoo.co.in", "outlook.com",
  "rediffmail.com", "hotmail.com",
] as const;

/**
 * RTO state codes weighted towards the metros Instant Mechanic actually operates
 * in — Delhi NCR, Mumbai, Bengaluru and Hyderabad carry most of the volume.
 */
export const PLATE_STATE_CODES = [
  "DL", "DL", "DL", "DL", "HR", "HR", "UP", "UP",
  "MH", "MH", "MH", "KA", "KA", "KA", "TS", "TS",
  "TN", "GJ", "RJ", "WB", "PB", "MP",
] as const;

/** Registration series letters. I and O are avoided on real plates (0/1 confusion). */
export const PLATE_SERIES_LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ";

/**
 * Real makes and models with the year each went on sale in India, so a seeded
 * vehicle never ends up as a 2014 Tata Punch.
 */
export interface VehicleModel {
  readonly make: string;
  readonly model: string;
  readonly since: number;
}

export const VEHICLE_MODELS: readonly VehicleModel[] = [
  // Maruti Suzuki — far and away the biggest share of Indian cars on the road
  { make: "Maruti Suzuki", model: "Swift", since: 2011 },
  { make: "Maruti Suzuki", model: "Baleno", since: 2015 },
  { make: "Maruti Suzuki", model: "Dzire", since: 2012 },
  { make: "Maruti Suzuki", model: "WagonR", since: 2012 },
  { make: "Maruti Suzuki", model: "Alto K10", since: 2014 },
  { make: "Maruti Suzuki", model: "Brezza", since: 2016 },
  { make: "Maruti Suzuki", model: "Ertiga", since: 2012 },
  { make: "Maruti Suzuki", model: "Celerio", since: 2014 },
  { make: "Maruti Suzuki", model: "Fronx", since: 2023 },
  { make: "Maruti Suzuki", model: "Grand Vitara", since: 2022 },

  // Hyundai
  { make: "Hyundai", model: "i20", since: 2012 },
  { make: "Hyundai", model: "Creta", since: 2015 },
  { make: "Hyundai", model: "Venue", since: 2019 },
  { make: "Hyundai", model: "Verna", since: 2012 },
  { make: "Hyundai", model: "Grand i10 Nios", since: 2019 },
  { make: "Hyundai", model: "Aura", since: 2020 },
  { make: "Hyundai", model: "Exter", since: 2023 },

  // Tata
  { make: "Tata", model: "Nexon", since: 2017 },
  { make: "Tata", model: "Punch", since: 2021 },
  { make: "Tata", model: "Altroz", since: 2020 },
  { make: "Tata", model: "Tiago", since: 2016 },
  { make: "Tata", model: "Tigor", since: 2017 },
  { make: "Tata", model: "Harrier", since: 2019 },
  { make: "Tata", model: "Safari", since: 2021 },

  // Honda
  { make: "Honda", model: "City", since: 2012 },
  { make: "Honda", model: "Amaze", since: 2013 },
  { make: "Honda", model: "Jazz", since: 2015 },
  { make: "Honda", model: "Elevate", since: 2023 },

  // Mahindra
  { make: "Mahindra", model: "XUV700", since: 2021 },
  { make: "Mahindra", model: "Scorpio-N", since: 2022 },
  { make: "Mahindra", model: "Thar", since: 2020 },
  { make: "Mahindra", model: "Bolero", since: 2012 },
  { make: "Mahindra", model: "XUV300", since: 2019 },

  // Toyota
  { make: "Toyota", model: "Innova Crysta", since: 2016 },
  { make: "Toyota", model: "Fortuner", since: 2012 },
  { make: "Toyota", model: "Glanza", since: 2019 },
  { make: "Toyota", model: "Urban Cruiser Hyryder", since: 2022 },

  // Kia
  { make: "Kia", model: "Seltos", since: 2019 },
  { make: "Kia", model: "Sonet", since: 2020 },
  { make: "Kia", model: "Carens", since: 2022 },

  // Renault / Nissan / MG / VW / Skoda
  { make: "Renault", model: "Kwid", since: 2015 },
  { make: "Renault", model: "Triber", since: 2019 },
  { make: "Nissan", model: "Magnite", since: 2020 },
  { make: "MG", model: "Hector", since: 2019 },
  { make: "MG", model: "Astor", since: 2021 },
  { make: "Volkswagen", model: "Virtus", since: 2022 },
  { make: "Volkswagen", model: "Taigun", since: 2021 },
  { make: "Skoda", model: "Slavia", since: 2022 },
  { make: "Skoda", model: "Kushaq", since: 2021 },
];

/** The service catalogue. Prices are in INR and are current list prices. */
export interface ServiceSeed {
  readonly name: string;
  readonly category:
    | "PERIODIC_SERVICE"
    | "BREAKDOWN_ASSISTANCE"
    | "BATTERY"
    | "TYRES_AND_WHEELS"
    | "BRAKES_AND_SUSPENSION"
    | "AC_SERVICE"
    | "DENT_AND_PAINT"
    | "INSPECTION";
  readonly basePrice: number;
  readonly estimatedMins: number;
  /** Relative booking frequency. Periodic services and breakdowns dominate. */
  readonly weight: number;
}

export const SERVICES: readonly ServiceSeed[] = [
  { name: "Basic Periodic Service", category: "PERIODIC_SERVICE", basePrice: 2499, estimatedMins: 90, weight: 22 },
  { name: "Comprehensive Periodic Service", category: "PERIODIC_SERVICE", basePrice: 5999, estimatedMins: 180, weight: 12 },
  { name: "Roadside Breakdown Assistance", category: "BREAKDOWN_ASSISTANCE", basePrice: 999, estimatedMins: 45, weight: 16 },
  { name: "Battery Jump Start & Replacement", category: "BATTERY", basePrice: 4999, estimatedMins: 40, weight: 11 },
  { name: "Flat Tyre Repair & Replacement", category: "TYRES_AND_WHEELS", basePrice: 1299, estimatedMins: 40, weight: 10 },
  { name: "Wheel Alignment & Balancing", category: "TYRES_AND_WHEELS", basePrice: 1799, estimatedMins: 60, weight: 7 },
  { name: "Brake Pad Replacement", category: "BRAKES_AND_SUSPENSION", basePrice: 3299, estimatedMins: 100, weight: 6 },
  { name: "Suspension Inspection & Repair", category: "BRAKES_AND_SUSPENSION", basePrice: 4799, estimatedMins: 150, weight: 4 },
  { name: "AC Service & Gas Refill", category: "AC_SERVICE", basePrice: 2999, estimatedMins: 120, weight: 6 },
  { name: "Dent & Paint (per panel)", category: "DENT_AND_PAINT", basePrice: 3999, estimatedMins: 240, weight: 3 },
  { name: "Pre-Purchase Inspection", category: "INSPECTION", basePrice: 1499, estimatedMins: 60, weight: 3 },
];
