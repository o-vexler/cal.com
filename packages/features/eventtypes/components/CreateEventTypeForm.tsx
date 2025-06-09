import type { ReactNode } from "react";
import { useState, useCallback } from "react";
import type { UseFormReturn } from "react-hook-form";

import { useIsPlatform } from "@calcom/atoms/hooks/useIsPlatform";
import { generateEventTypeFromDescription } from "@calcom/lib/ai/claude";
import { useDebounce } from "@calcom/lib/hooks/useDebounce";
import type { CreateEventTypeFormValues } from "@calcom/lib/hooks/useCreateEventType";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import { md } from "@calcom/lib/markdownIt";
import slugify from "@calcom/lib/slugify";
import turndown from "@calcom/lib/turndownService";
import { Button } from "@calcom/ui/components/button";
import { Editor } from "@calcom/ui/components/editor";
import { Form } from "@calcom/ui/components/form";
import { TextAreaField } from "@calcom/ui/components/form";
import { TextField } from "@calcom/ui/components/form";
import { showToast } from "@calcom/ui/components/toast";
import { Tooltip } from "@calcom/ui/components/tooltip";

export default function CreateEventTypeForm({
  form,
  isManagedEventType,
  handleSubmit,
  pageSlug,
  isPending,
  urlPrefix,
  SubmitButton,
}: {
  form: UseFormReturn<CreateEventTypeFormValues>;
  isManagedEventType: boolean;
  handleSubmit: (values: CreateEventTypeFormValues) => void;
  pageSlug?: string;
  isPending: boolean;
  urlPrefix?: string;
  SubmitButton: (isPending: boolean) => ReactNode;
}) {
  const isPlatform = useIsPlatform();
  const { t } = useLocale();
  const [firstRender, setFirstRender] = useState(true);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const { register } = form;
  
  const description = form.watch("description");
  const debouncedDescription = useDebounce(description, 1000);

  const generateAISuggestions = useCallback(async () => {
    if (!debouncedDescription?.trim() || isGeneratingAI) return;
    
    setIsGeneratingAI(true);
    try {
      const aiResponse = await generateEventTypeFromDescription(debouncedDescription);
      
      if (!form.getValues("title") || form.getValues("title") === "") {
        form.setValue("title", aiResponse.title);
      }
      
      if (!form.formState.touchedFields["slug"]) {
        form.setValue("slug", aiResponse.slug);
      }
      
      showToast(t("ai_suggestions_generated"), "success");
    } catch (error) {
      console.error("AI generation failed:", error);
      showToast(t("ai_generation_failed"), "error");
    } finally {
      setIsGeneratingAI(false);
    }
  }, [debouncedDescription, form, isGeneratingAI, t]);
  return (
    <Form
      form={form}
      handleSubmit={(values) => {
        handleSubmit(values);
      }}>
      <div className="mt-3 space-y-6 pb-11">
        <div className="space-y-2">
          <TextField
            label={t("title")}
            placeholder={t("quick_chat")}
            data-testid="event-type-quick-chat"
            {...register("title")}
            onChange={(e) => {
              form.setValue("title", e?.target.value);
              if (form.formState.touchedFields["slug"] === undefined) {
                form.setValue("slug", slugify(e?.target.value));
              }
            }}
          />
          {debouncedDescription?.trim() && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={generateAISuggestions}
              disabled={isGeneratingAI}
              className="w-fit">
              {isGeneratingAI ? t("generating_ai_suggestions") : t("generate_with_ai")}
            </Button>
          )}
        </div>

        {urlPrefix && urlPrefix.length >= 21 ? (
          <div>
            <TextField
              label={isPlatform ? "Slug" : `${t("url")}: ${urlPrefix}`}
              required
              addOnLeading={
                !isPlatform ? (
                  <Tooltip content={!isManagedEventType ? pageSlug : t("username_placeholder")}>
                    <span className="max-w-24 md:max-w-56">
                      /{!isManagedEventType ? pageSlug : t("username_placeholder")}/
                    </span>
                  </Tooltip>
                ) : undefined
              }
              {...register("slug")}
              onChange={(e) => {
                form.setValue("slug", slugify(e?.target.value), { shouldTouch: true });
              }}
            />

            {isManagedEventType && !isPlatform && (
              <p className="mt-2 text-sm text-gray-600">{t("managed_event_url_clarification")}</p>
            )}
          </div>
        ) : (
          <div>
            <TextField
              label={isPlatform ? "Slug" : t("url")}
              required
              addOnLeading={
                !isPlatform ? (
                  <Tooltip
                    content={`${urlPrefix}/${!isManagedEventType ? pageSlug : t("username_placeholder")}/`}>
                    <span className="max-w-24 md:max-w-56">
                      {urlPrefix}/{!isManagedEventType ? pageSlug : t("username_placeholder")}/
                    </span>
                  </Tooltip>
                ) : undefined
              }
              {...register("slug")}
              onChange={(e) => {
                form.setValue("slug", slugify(e?.target.value), { shouldTouch: true });
              }}
            />
            {isManagedEventType && !isPlatform && (
              <p className="mt-2 text-sm text-gray-600">{t("managed_event_url_clarification")}</p>
            )}
          </div>
        )}
        <>
          {isPlatform ? (
            <TextAreaField {...register("description")} placeholder={t("quick_video_meeting")} />
          ) : (
            <Editor
              getText={() => md.render(form.getValues("description") || "")}
              setText={(value: string) => form.setValue("description", turndown(value))}
              excludedToolbarItems={["blockType", "link"]}
              placeholder={t("quick_video_meeting")}
              firstRender={firstRender}
              setFirstRender={setFirstRender}
              maxHeight="200px"
            />
          )}

          <div className="relative">
            <TextField
              type="number"
              required
              min="10"
              placeholder="15"
              label={t("duration")}
              className="pr-4"
              {...register("length", { valueAsNumber: true })}
              addOnSuffix={t("minutes")}
            />
          </div>
        </>
      </div>
      {SubmitButton(isPending)}
    </Form>
  );
}
