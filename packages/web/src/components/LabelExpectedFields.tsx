import type { ExpectedLabelValue, ExpectedLabelValues, LabelFieldDefinition } from "@label-validator/shared";
import { getExpectedValueAtPath } from "@label-validator/shared";

type LabelExpectedFieldsProps = {
    fields: LabelFieldDefinition[];
    values: ExpectedLabelValues;
    onChange: (path: string, value: ExpectedLabelValue) => void;
};

const LabelExpectedFields = ({ fields, values, onChange }: LabelExpectedFieldsProps) => (
    <div className="home-expected-fields">
        {fields.map((field) =>
            field.kind === "group" ? (
                <fieldset key={field.path} className="home-expected-group">
                    <legend>{field.label}</legend>
                    <LabelExpectedFields fields={field.fields} values={values} onChange={onChange} />
                </fieldset>
            ) : field.kind === "boolean" ? (
                <label key={field.path} className="home-expected-field home-expected-field--checkbox">
                    <input
                        type="checkbox"
                        checked={getExpectedValueAtPath(values, field.path) === true}
                        onChange={(event) => onChange(field.path, event.target.checked)}
                    />
                    <span>{field.label}</span>
                </label>
            ) : (
                <label key={field.path} className="home-expected-field">
                    <span className="home-expected-field-label">{field.label}</span>
                    <input
                        type="text"
                        value={String(getExpectedValueAtPath(values, field.path) ?? "")}
                        onChange={(event) => onChange(field.path, event.target.value)}
                        placeholder={`Expected ${field.label.toLowerCase()}`}
                    />
                </label>
            ),
        )}
    </div>
);

export default LabelExpectedFields;
