import pandas as pd
import joblib

class ChurnService :

    def __init__( self ) :
        self.model = joblib.load( 'model.pkl' )
        self.metrics = joblib.load( 'metrics.pkl' )

    def predict( self , item ) :
        sample = pd.DataFrame( [ {
            'credit_score'     : int( item['credit_score'] ) ,
            'age'              : int( item['age'] ) ,
            'tenure'           : int( item['tenure'] ) ,
            'balance'          : float( item['balance'] ) ,
            'products_number'  : int( item['products_number'] ) ,
            'credit_card'      : int( item['credit_card'] ) ,
            'active_member'    : int( item['active_member'] ) ,
            'estimated_salary' : float( item['estimated_salary'] ) ,
            'country'          : item['country'] ,
            'gender'           : item['gender']
        } ] )

        sample['country'] = sample['country'].astype( self.metrics['cat_dtypes']['country'] )
        sample['gender']  = sample['gender'].astype( self.metrics['cat_dtypes']['gender'] )

        churn       = int( self.model.predict( sample )[0] )
        probability = float( self.model.predict_proba( sample )[0][1] )

        # React(PredictionResult.jsx) 가 읽는 이름에 맞춤
        return {
            'prediction'       : churn ,                                  # 0 유지 / 1 이탈
            'churn_probability': round( probability , 4 ) ,               # 이탈 확률
            'label'            : '이탈 위험' if churn == 1 else '유지 예상' ,
            'metrics'          : { 'f1' : self.metrics['f1'] }            # 테스트 F1
        }



result_service = ChurnService()