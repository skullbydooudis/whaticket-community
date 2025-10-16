import { Request, Response, NextFunction } from "express";
import * as Yup from "yup";
import AppError from "../errors/AppError";
import logger from "../utils/logger";

interface ValidationSchema {
  body?: Yup.AnySchema;
  params?: Yup.AnySchema;
  query?: Yup.AnySchema;
}

interface ValidationOptions {
  abortEarly?: boolean;
  stripUnknown?: boolean;
  context?: any;
}

export const validate = (
  schema: ValidationSchema,
  options: ValidationOptions = {}
) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const validationOptions: Yup.ValidateOptions = {
        abortEarly: options.abortEarly !== undefined ? options.abortEarly : false,
        stripUnknown: options.stripUnknown !== undefined ? options.stripUnknown : true,
        context: options.context || {}
      };

      if (schema.body) {
        req.body = await schema.body.validate(req.body, validationOptions);
      }

      if (schema.params) {
        req.params = await schema.params.validate(req.params, validationOptions);
      }

      if (schema.query) {
        req.query = await schema.query.validate(req.query, validationOptions);
      }

      next();
    } catch (error) {
      if (error instanceof Yup.ValidationError) {
        const errors = error.inner.map(err => ({
          field: err.path,
          message: err.message
        }));

        logger.warn("Validation error:", { errors, path: req.path });

        throw new AppError(
          JSON.stringify({
            message: "Validation failed",
            errors
          }),
          400
        );
      }

      next(error);
    }
  };
};

export const sanitizeInput = (input: string): string => {
  if (!input) return input;

  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .trim();
};

export const sanitizeObject = <T extends Record<string, any>>(obj: T): T => {
  const sanitized = { ...obj };

  for (const key in sanitized) {
    if (typeof sanitized[key] === "string") {
      sanitized[key] = sanitizeInput(sanitized[key]) as any;
    } else if (typeof sanitized[key] === "object" && sanitized[key] !== null) {
      sanitized[key] = sanitizeObject(sanitized[key]);
    }
  }

  return sanitized;
};

export const sanitizeMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  if (req.query) {
    req.query = sanitizeObject(req.query as Record<string, any>);
  }

  if (req.params) {
    req.params = sanitizeObject(req.params);
  }

  next();
};

export const commonSchemas = {
  id: Yup.number()
    .integer()
    .positive()
    .required()
    .label("ID"),

  uuid: Yup.string()
    .uuid()
    .required()
    .label("UUID"),

  email: Yup.string()
    .email()
    .lowercase()
    .trim()
    .required()
    .label("Email"),

  password: Yup.string()
    .min(8)
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    )
    .required()
    .label("Password"),

  phone: Yup.string()
    .matches(
      /^\+?[1-9]\d{1,14}$/,
      "Phone number must be in E.164 format"
    )
    .required()
    .label("Phone"),

  pagination: Yup.object({
    page: Yup.number()
      .integer()
      .positive()
      .default(1)
      .label("Page"),
    limit: Yup.number()
      .integer()
      .positive()
      .max(100)
      .default(20)
      .label("Limit"),
    sortBy: Yup.string()
      .optional()
      .label("Sort By"),
    sortOrder: Yup.string()
      .oneOf(["ASC", "DESC"])
      .default("DESC")
      .label("Sort Order")
  }),

  dateRange: Yup.object({
    startDate: Yup.date()
      .required()
      .label("Start Date"),
    endDate: Yup.date()
      .required()
      .min(
        Yup.ref("startDate"),
        "End date must be after start date"
      )
      .label("End Date")
  }),

  status: (values: string[]) =>
    Yup.string()
      .oneOf(values)
      .required()
      .label("Status")
};

export const validateLeadData = Yup.object().shape({
  name: Yup.string()
    .required()
    .min(2)
    .max(255)
    .label("Name"),
  email: commonSchemas.email.optional(),
  phone: Yup.string()
    .required()
    .label("Phone"),
  budgetMin: Yup.number()
    .positive()
    .optional()
    .label("Budget Min"),
  budgetMax: Yup.number()
    .positive()
    .min(
      Yup.ref("budgetMin"),
      "Budget max must be greater than budget min"
    )
    .optional()
    .label("Budget Max"),
  propertyType: Yup.string()
    .optional()
    .label("Property Type"),
  source: Yup.string()
    .required()
    .label("Source"),
  notes: Yup.string()
    .max(1000)
    .optional()
    .label("Notes")
});

export const validatePropertyData = Yup.object().shape({
  title: Yup.string()
    .required()
    .min(10)
    .max(255)
    .label("Title"),
  description: Yup.string()
    .required()
    .min(50)
    .label("Description"),
  type: Yup.string()
    .required()
    .oneOf(["apartment", "house", "commercial", "land", "penthouse"])
    .label("Type"),
  status: Yup.string()
    .required()
    .oneOf(["available", "sold", "reserved", "rented"])
    .label("Status"),
  price: Yup.number()
    .positive()
    .required()
    .label("Price"),
  area: Yup.number()
    .positive()
    .required()
    .label("Area"),
  bedrooms: Yup.number()
    .integer()
    .min(0)
    .required()
    .label("Bedrooms"),
  bathrooms: Yup.number()
    .integer()
    .min(0)
    .required()
    .label("Bathrooms"),
  parkingSpaces: Yup.number()
    .integer()
    .min(0)
    .default(0)
    .label("Parking Spaces"),
  address: Yup.string()
    .required()
    .label("Address"),
  city: Yup.string()
    .required()
    .label("City"),
  state: Yup.string()
    .required()
    .label("State"),
  zipCode: Yup.string()
    .required()
    .label("Zip Code"),
  latitude: Yup.number()
    .min(-90)
    .max(90)
    .optional()
    .label("Latitude"),
  longitude: Yup.number()
    .min(-180)
    .max(180)
    .optional()
    .label("Longitude")
});

export const validateProposalData = Yup.object().shape({
  leadId: commonSchemas.id,
  propertyId: commonSchemas.id,
  proposedValue: Yup.number()
    .positive()
    .required()
    .label("Proposed Value"),
  downPayment: Yup.number()
    .positive()
    .optional()
    .label("Down Payment"),
  installments: Yup.number()
    .integer()
    .positive()
    .max(360)
    .optional()
    .label("Installments"),
  notes: Yup.string()
    .max(1000)
    .optional()
    .label("Notes")
});

export const validateVisitData = Yup.object().shape({
  propertyId: commonSchemas.id,
  contactId: commonSchemas.id,
  leadId: commonSchemas.id.optional(),
  scheduledDate: Yup.date()
    .required()
    .min(new Date(), "Visit date must be in the future")
    .label("Scheduled Date"),
  notes: Yup.string()
    .max(500)
    .optional()
    .label("Notes")
});

export const validateUserData = Yup.object().shape({
  name: Yup.string()
    .required()
    .min(2)
    .max(255)
    .label("Name"),
  email: commonSchemas.email,
  password: commonSchemas.password,
  profile: Yup.string()
    .required()
    .oneOf(["admin", "user", "manager"])
    .label("Profile")
});

export const validateLoginData = Yup.object().shape({
  email: commonSchemas.email,
  password: Yup.string()
    .required()
    .label("Password")
});

export default validate;
