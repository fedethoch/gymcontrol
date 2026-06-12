export type ExerciseFormField = "name" | "description" | "imageUrl";

export type ExerciseFormPayload = {
  exerciseId?: string;
  name: string;
  description: string;
  imageUrl: string;
};

export type ExerciseFormState = {
  status: "idle" | "error" | "success";
  message: string | null;
  fieldErrors: Partial<Record<ExerciseFormField, string>>;
};

export const INITIAL_EXERCISE_FORM_STATE: ExerciseFormState = {
  status: "idle",
  message: null,
  fieldErrors: {},
};
