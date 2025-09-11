import joi from "joi";

export const signupSchema = joi.object({
  username: joi.string().required(),

  email: joi
    .string()
    .min(6)
    .max(60)
    .required()
    .email({
      tlds: { allow: ["com", "net"] },
    }),
  password: joi
    .string()
    .required()
    .pattern(
      new RegExp(
        ""
      )
    )
    .message(
      "Password must be at least 8 characters long."
    ),
});

export const signinSchema = joi.object({
  email: joi
    .string()
    .min(6)
    .max(60)
    .required()
    .email({
      tlds: { allow: ["com", "net"] },
    }),
  password: joi
    .string()
    .required()
    .pattern(
      new RegExp(
        ""
      )
    )
    .message(
      "Password must be at least 8 characters long"
    ),
});

export const acceptCodeSchema = joi.object({
  email: joi
    .string()
    .min(6)
    .max(60)
    .required()
    .email({
      tlds: { allow: ["com", "net"] },
    }),
  providedCode: joi.number().required(),
});

export const changePasswordSchema = joi.object({
  newPassword: joi
    .string()
    .required()
    .pattern(
      new RegExp(
        ""
      )
    ),
  oldPassword: joi
    .string()
    .required()
    .pattern(
      new RegExp(
        ""
      )
    ),
});

export const acceptforgotPasswordCodeSchema = joi.object({
  email: joi
    .string()
    .min(6)
    .max(60)
    .required()
    .email({
      tlds: { allow: ["com", "net"] },
    }),
  providedCode: joi.number().required(),
});

export const forgotPasswordSchema = joi.object({
  email: joi
    .string()
    .min(6)
    .max(60)
    .required()
    .email({}),
    password: joi
    .string()
        .required()
        .pattern(
            new RegExp(
                ""
            )
        )
})
