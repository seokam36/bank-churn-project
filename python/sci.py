## lightGBM 튜닝 / 서빙 : 은행 고객 이탈(churn) 예측 - 이진 분류
import warnings
warnings.filterwarnings('ignore', message=".*'eval_set' is deprecated.*")

import pandas as pd

df = pd.read_csv('Bank Customer Churn Prediction.csv')
print(df.shape)
print(df.duplicated().sum())  # 중복행 개수
print(df.isna().sum())        # 결측치 개수
print(df['churn'].value_counts()) # 'churn' 분류값 개수


num_cols = ['credit_score', 'age', 'tenure', 'balance', 'products_number',
            'credit_card', 'active_member', 'estimated_salary']
cat_cols = ['country', 'gender']

for col in cat_cols:
    df[col] = df[col].astype('category')
X = df[num_cols + cat_cols]
Y = df['churn']               # 0 유지 / 1 이탈
from sklearn.model_selection import train_test_split
# 이탈고객 20프로 비율 맞추기위해
X_train, X_test, Y_train, Y_test = train_test_split(X, Y, random_state=42, test_size=0.2, stratify=Y)

import optuna
from lightgbm import LGBMClassifier, early_stopping
import numpy as np
from sklearn.model_selection import StratifiedKFold
from sklearn.metrics import f1_score

optuna.logging.set_verbosity( optuna.logging.WARNING )

# 목적함수
def objective( trial ) :

    cv = StratifiedKFold( n_splits=5 , shuffle=True, random_state=42 )
    cv_f1_scores = [ ]
    best_iterations = [ ]
    for train_idx, val_idx in cv.split( X_train , Y_train ) :

        X_tr, X_val = X_train.iloc[ train_idx ] , X_train.iloc[val_idx]
        Y_tr, Y_val = Y_train.iloc[ train_idx ] , Y_train.iloc[val_idx]

        model = LGBMClassifier(
            n_estimators=1000,
            learning_rate=trial.suggest_float( 'learning_rate' , 0.01 , 0.1 , log=True ) ,
            num_leaves=trial.suggest_int( 'num_leaves' , 8, 30 ),
            max_depth=trial.suggest_int( 'max_depth' , 3 , 6 ),
            min_child_samples=trial.suggest_int( 'min_child_samples', 30 , 150 ),
            subsample=trial.suggest_float( 'subsample' , 0.6 , 1.0 ) ,
            subsample_freq=1, verbose=-1, random_state=42, n_jobs=-1 ,
            colsample_bytree=trial.suggest_float( 'colsample_bytree' , 0.6 , 1.0 ),
            class_weight='balanced',   # 분류 모델 이므로 불균형 보정
        )

        # K폴드별 훈련용/검증용 으로 학습
        model.fit( X_tr , Y_tr , eval_set=[ (X_val,Y_val) ] ,
                   callbacks=[ early_stopping( stopping_rounds=50, verbose=False ) ] )

        f1 = f1_score( Y_val , model.predict( X_val ) , average='macro' )
        cv_f1_scores.append( f1 )
        best_iterations.append( model.best_iteration_ )
    # k폴드에서 산출된 최적 트리 개수의 평균값을 trial의 속성으로 저장
    trial.set_user_attr( 'best_n_estimators' , int( np.mean( best_iterations ) ) )
    return np.mean( cv_f1_scores ) # 검증 평가 평균 점수 반환

sampler = optuna.samplers.TPESampler( seed=42 )
study = optuna.create_study( direction='maximize' , sampler= sampler )
study.optimize( objective , n_trials=20 )

# 최적 모델
print( '최적 하이퍼파라미터:', study.best_params )
best_n_estimators = study.best_trial.user_attrs['best_n_estimators']
print( '최적 트리: ', best_n_estimators )
print( '교차검증 F1: ', round( study.best_value, 4 ) )


# 최적 파라미터로 모델 학습
final_model = LGBMClassifier(
    random_state=42, verbose=-1, n_jobs=-1,
    subsample_freq=1, class_weight='balanced',
    **study.best_params,
    n_estimators=best_n_estimators
)
final_model.fit(X_train, Y_train)
from sklearn.metrics import classification_report
Y_pred = final_model.predict(X_test)
test_f1 = f1_score(Y_test, Y_pred, average='macro')
print('train f1 : ', f1_score(Y_train, final_model.predict(X_train), average='macro'))
print('test f1 : ', test_f1)


# joblib 저장/로드
import joblib
joblib.dump(final_model, 'model.pkl')
# 성능 지표 + 학습 때 범주 목록(서버에서 범주 맞출 때 사용) 따로 저장
joblib.dump({'f1': round(test_f1, 4),
             'cv_f1': round(study.best_value, 4),
             'best_params': study.best_params,
             'cat_dtypes': {col: X_train[col].dtype for col in cat_cols}},
            'metrics.pkl')
model = joblib.load('model.pkl')
metrics = joblib.load('metrics.pkl')

